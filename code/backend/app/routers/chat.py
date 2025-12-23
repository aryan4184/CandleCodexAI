from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.db import Message, Conversation
from app.schemas import MessageCreate, MessageResponse
from app.services import trigger_n8n_workflow
from app.routers.auth import get_current_user

router = APIRouter(tags=["chat"])


COST_TEXT = 10
COST_IMAGE = 500

@router.post("/chat", response_model=MessageResponse)
async def chat_endpoint(
    msg: MessageCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. Create new conversation if needed
    if not msg.conversation_id:
        new_conv = Conversation(user_id=current_user.id)
        db.add(new_conv)
        db.flush()  # get id without committing
        conversation_id = new_conv.id
    else:
        conversation_id = msg.conversation_id


    # 2. CHECK BALANCE
    if user.token_balance < COST_TEXT:
         raise HTTPException(status_code=402, detail="Insufficient tokens. Please top up.")


    # 2. Save USER message
    user_message = Message(
        conversation_id=conversation_id,
        sender="user",
        content=msg.content
    )
    db.add(user_message)
    db.flush()



    # 3. Call n8n workflow
    ai_result = await trigger_n8n_workflow(msg.content, current_user.id)



    # 4. CALCULATE DEDUCTION
    cost = COST_TEXT
    if response['image_url']:
        cost = COST_IMAGE


    # 5. DEDUCT & SAVE
    user.token_balance -= cost
    db.commit()


    # 4. Save AI message
    ai_message = Message(
        conversation_id=conversation_id,
        sender="ai",
        content=ai_result["text"],
        # image_url=ai_result["image"]
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)

    return ai_message
