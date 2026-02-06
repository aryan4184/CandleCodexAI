from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session
from app.db import get_db
from app.db import Message, Conversation
from app.schemas import MessageCreate, MessageResponse, ConversationResponse, ConversationUpdate
from app.services.services import trigger_n8n_workflow
from app.services.auth import get_current_user

router = APIRouter(tags=["chat"])


COST_TEXT = 10
COST_IMAGE = 50

@router.get("/chat/conversations", response_model=list[ConversationResponse])
async def get_conversations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(desc(Conversation.created_at))
        .all()
    )

@router.delete("/chat/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(conv)
    db.commit()
    return

@router.put("/chat/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: int,
    conversation_update: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conv.title = conversation_update.title
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/chat/history", response_model=list[MessageResponse])
async def get_chat_history(
    conversation_id: int | None = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    target_conv_id = conversation_id

    # If no specific ID, get the latest one
    if not target_conv_id:
        last_conv = (
            db.query(Conversation)
            .filter(Conversation.user_id == current_user.id)
            .order_by(desc(Conversation.created_at))
            .first()
        )
        if last_conv:
            target_conv_id = last_conv.id
    
    if not target_conv_id:
        return []
    
    # Verify ownership (basic check)
    # real app should check if conversation belongs to user

    # Return messages ordered by timestamp
    return db.query(Message).filter(Message.conversation_id == target_conv_id).order_by(Message.timestamp).all()

@router.post("/chat", response_model=MessageResponse)
async def chat_endpoint(
    msg: MessageCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. Create new conversation if needed
    if not msg.conversation_id:
        # Auto-generate title from first message
        title_summary = msg.content[:30] + "..." if len(msg.content) > 30 else msg.content
        
        new_conv = Conversation(user_id=current_user.id, title=title_summary)
        db.add(new_conv)
        db.flush()  # get id without committing
        conversation_id = new_conv.id
    else:
        conversation_id = msg.conversation_id


    # 2. CHECK BALANCE
    if current_user.token_balance < COST_TEXT:
         raise HTTPException(status_code=402, detail="Insufficient tokens. Please top up.")


    # 3. GET HISTORY (Context) - Fetch BEFORE saving current message
    # Fetch last 10 messages (descending), then reverse to be chronological
    history_msgs = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(desc(Message.timestamp))
        .limit(10)
        .all()
    )[::-1]
    
    # Format for n8n/AI (e.g. list of dicts)
    history_context = [
        {"role": m.sender, "content": m.content} 
        for m in history_msgs
    ]

    # 4. Save USER message (Now, after fetching history, so "history" excludes current)
    # The user wanted "last 10 texts along with the current message". 
    # Current message is sent as 'message' in payload. 
    # 'history' is previous context.
    user_message = Message(
        conversation_id=conversation_id,
        sender="user",
        content=msg.content,
        image_url=msg.image_data # Store base64 or URL
    )
    db.add(user_message)
    db.flush()

    # 5. Call n8n workflow
    # Pass session_id (conversation_id as string)
    ai_result = await trigger_n8n_workflow(
        text=msg.content, 
        user_id=current_user.id, 
        history=history_context, 
        image_data=msg.image_data,
        session_id=str(conversation_id)
    )
    print(f"DEBUG: n8n response: {ai_result}") # Debug logging



    # 4. CALCULATE DEDUCTION
    cost = COST_TEXT
    # if ai_result['image_url']:
    #     cost = COST_IMAGE


    # 5. DEDUCT & SAVE
    current_user.token_balance -= cost
    db.commit()


    # 4. Save AI message
    # User requested raw chart_url without conversion
    ai_message = Message(
        conversation_id=conversation_id,
        sender="ai",
        content=ai_result.get("text", ""),
        image_url=ai_result.get("chart_url") 
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)

    return ai_message
