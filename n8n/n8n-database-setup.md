# n8n Database Configuration Guide
## Using Same PostgreSQL Database with Schema Separation

---

## Recommended Approach: Same Database, Separate Schemas

Instead of creating a new database, create separate **schemas** within the same database:

```
PostgreSQL Database: ai_chat_db
├── Schema: public (your application data)
│   ├── users
│   ├── sessions
│   └── messages
│
└── Schema: n8n (n8n workflow data)
    ├── execution_entity
    ├── workflow_entity
    └── credentials_entity
```

---

## Step-by-Step Setup

### Option 1: Separate Schemas (Recommended)

#### 1. Create n8n Schema in Your Existing Database

```sql
-- Connect to your database
psql -U ai_chat_user -d ai_chat_db

-- Create n8n schema
CREATE SCHEMA IF NOT EXISTS n8n;

-- Grant permissions to your user
GRANT ALL PRIVILEGES ON SCHEMA n8n TO ai_chat_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA n8n TO ai_chat_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA n8n GRANT ALL ON TABLES TO ai_chat_user;
```

#### 2. Configure n8n to Use the Schema

Update your n8n environment variables:

```bash
# .env or environment variables for n8n

# Database connection
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=ai_chat_db
DB_POSTGRESDB_USER=ai_chat_user
DB_POSTGRESDB_PASSWORD=your_password
DB_POSTGRESDB_SCHEMA=n8n

# Important: This tells n8n to use the "n8n" schema
```

#### 3. Start n8n

```bash
# n8n will automatically create its tables in the n8n schema
n8n start

# Or with Docker:
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e DB_TYPE=postgresdb \
  -e DB_POSTGRESDB_HOST=host.docker.internal \
  -e DB_POSTGRESDB_PORT=5432 \
  -e DB_POSTGRESDB_DATABASE=ai_chat_db \
  -e DB_POSTGRESDB_USER=ai_chat_user \
  -e DB_POSTGRESDB_PASSWORD=your_password \
  -e DB_POSTGRESDB_SCHEMA=n8n \
  n8nio/n8n
```

#### 4. Verify Setup

```sql
-- Check that both schemas exist
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('public', 'n8n');

-- List tables in public schema (your app)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- List tables in n8n schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'n8n';
```

---

## Option 2: Separate Database (If You Need Complete Isolation)

Only use this if you have specific requirements like:
- Different backup schedules
- Different geographic regions
- Strict data isolation policies

### Setup Steps:

```sql
-- 1. Create new database for n8n
CREATE DATABASE n8n_db;

-- 2. Create user (optional - can reuse existing)
CREATE USER n8n_user WITH PASSWORD 'n8n_password';
GRANT ALL PRIVILEGES ON DATABASE n8n_db TO n8n_user;
```

### n8n Configuration:

```bash
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n_db
DB_POSTGRESDB_USER=n8n_user
DB_POSTGRESDB_PASSWORD=n8n_password
```

---

## Accessing Your App Data from n8n Workflows

With both approaches, you can easily query your application data from n8n workflows:

### Using Postgres Node in n8n

#### Setup Database Credentials in n8n

1. Go to n8n UI → Credentials
2. Add "Postgres" credentials
3. Enter your database details:

```
Host: localhost
Database: ai_chat_db
User: ai_chat_user
Password: your_password
Port: 5432
Schema: public  # Your app's schema
SSL: false (or true for production)
```

#### Example: Get Chat History in n8n Workflow

**Node Configuration:**

```javascript
// PostgreSQL Node in n8n
{
  "operation": "executeQuery",
  "query": "SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 20",
  "queryParameters": "={{ $json.session_id }}"
}
```

#### Example: Save AI Response to Database

```javascript
// PostgreSQL Node - Insert Message
{
  "operation": "insert",
  "table": "messages",
  "columns": "session_id, role, content, token_count, created_at",
  "values": "={{ $json.session_id }}, 'assistant', ={{ $json.response }}, ={{ $json.tokens }}, NOW()"
}
```

---

## Updated n8n Workflow with Database Access

Here's an enhanced workflow that reads from and writes to your database:

### Complete Workflow Nodes:

```
1. Webhook Trigger
   ↓
2. Parse Input
   ↓
3. [NEW] Get Chat History from Database
   ↓
4. Format Messages for AI
   ↓
5. Call AI API
   ↓
6. Process AI Response
   ↓
7. [NEW] Save AI Response to Database
   ↓
8. [NEW] Update Session Timestamp
   ↓
9. Return Response
```

### Node 3: Get Chat History (PostgreSQL Node)

```json
{
  "name": "Get Chat History",
  "type": "n8n-nodes-base.postgres",
  "credentials": "postgres",
  "parameters": {
    "operation": "executeQuery",
    "query": "SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 20",
    "queryParameters": "={{ $json.session_id }}"
  }
}
```

### Node 7: Save AI Response (PostgreSQL Node)

```json
{
  "name": "Save AI Response",
  "type": "n8n-nodes-base.postgres",
  "credentials": "postgres",
  "parameters": {
    "operation": "executeQuery",
    "query": "INSERT INTO messages (session_id, role, content, token_count, created_at) VALUES ($1, 'assistant', $2, $3, NOW()) RETURNING id, created_at",
    "queryParameters": "={{ $json.session_id }}, ={{ $json.ai_response }}, ={{ $json.token_count }}"
  }
}
```

### Node 8: Update Session (PostgreSQL Node)

```json
{
  "name": "Update Session",
  "type": "n8n-nodes-base.postgres",
  "credentials": "postgres",
  "parameters": {
    "operation": "executeQuery",
    "query": "UPDATE sessions SET updated_at = NOW() WHERE id = $1",
    "queryParameters": "={{ $json.session_id }}"
  }
}
```

---

## Should FastAPI Still Call n8n?

### Two Approaches:

#### Approach A: FastAPI → n8n (Hybrid - Recommended for Complex AI Logic)

**Use when:**
- You need complex AI workflows (multiple AI calls, decision trees)
- You want to use n8n's visual workflow editor
- You need to integrate multiple AI providers
- You want non-developers to modify AI logic

**Flow:**
```
FastAPI receives message
  ↓
FastAPI saves user message to DB
  ↓
FastAPI calls n8n webhook
  ↓
n8n gets chat history from DB
  ↓
n8n calls AI API
  ↓
n8n saves AI response to DB
  ↓
n8n returns response to FastAPI
  ↓
FastAPI returns to frontend
```

**Updated FastAPI Code:**

```python
# services/message_service.py
async def process_chat_message(
    self,
    session_id: UUID,
    user_message: str
) -> tuple[Message, Message]:
    # 1. Create user message in DB
    user_msg = self.create_message(MessageCreate(
        session_id=session_id,
        content=user_message,
        role="user"
    ))
    
    # 2. Call n8n (it will handle DB operations and AI call)
    try:
        n8n_response = await self.n8n_service.send_chat_request(
            session_id=session_id,
            user_message=user_message,
            chat_history=[]  # n8n will get history from DB
        )
        
        # 3. Get the assistant message that n8n created
        assistant_msg = self.db.query(Message).filter(
            Message.session_id == session_id,
            Message.role == "assistant"
        ).order_by(Message.created_at.desc()).first()
        
    except Exception as e:
        # Fallback: create error message
        assistant_msg = self.create_message(MessageCreate(
            session_id=session_id,
            content="I apologize, but I encountered an error.",
            role="assistant"
        ))
    
    return user_msg, assistant_msg
```

#### Approach B: FastAPI Handles Everything (Simpler)

**Use when:**
- Simple AI interactions
- You want full control in code
- Smaller team / solo developer
- Don't need visual workflow editing

**Flow:**
```
FastAPI receives message
  ↓
FastAPI saves user message to DB
  ↓
FastAPI gets chat history from DB
  ↓
FastAPI calls AI API directly
  ↓
FastAPI saves AI response to DB
  ↓
FastAPI returns to frontend
```

**Code (No n8n):**

```python
# services/message_service.py
import httpx

async def process_chat_message(
    self,
    session_id: UUID,
    user_message: str
) -> tuple[Message, Message]:
    # 1. Save user message
    user_msg = self.create_message(MessageCreate(
        session_id=session_id,
        content=user_message,
        role="user"
    ))
    
    # 2. Get chat history
    chat_history = self.get_chat_history(session_id)
    
    # 3. Call AI directly
    messages = [{"role": msg["role"], "content": msg["content"]} 
                for msg in chat_history]
    messages.append({"role": "user", "content": user_message})
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            json={
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 4096,
                "messages": messages
            }
        )
        ai_response = response.json()["content"][0]["text"]
    
    # 4. Save AI response
    assistant_msg = self.create_message(MessageCreate(
        session_id=session_id,
        content=ai_response,
        role="assistant"
    ))
    
    return user_msg, assistant_msg
```

---

## Recommendation Summary

### For Your Use Case, I Recommend:

✅ **Same Database, Separate Schemas**
- Keep everything in `ai_chat_db`
- Your app uses `public` schema
- n8n uses `n8n` schema

✅ **Hybrid Approach (FastAPI + n8n)**
- FastAPI handles HTTP, validation, auth
- n8n handles complex AI workflows
- Both read/write to same database

### Why This Works Best:

1. **Flexibility**: Easy to modify AI logic in n8n UI
2. **Simplicity**: One database to manage
3. **Performance**: No cross-database queries
4. **Scalability**: Easy to add more AI workflows
5. **Maintainability**: Clear separation of concerns

---

## Quick Start Commands

```bash
# 1. Create n8n schema
psql -U ai_chat_user -d ai_chat_db -c "CREATE SCHEMA IF NOT EXISTS n8n;"
psql -U ai_chat_user -d ai_chat_db -c "GRANT ALL PRIVILEGES ON SCHEMA n8n TO ai_chat_user;"

# 2. Start n8n with schema configuration
export DB_TYPE=postgresdb
export DB_POSTGRESDB_HOST=localhost
export DB_POSTGRESDB_DATABASE=ai_chat_db
export DB_POSTGRESDB_USER=ai_chat_user
export DB_POSTGRESDB_PASSWORD=your_password
export DB_POSTGRESDB_SCHEMA=n8n

n8n start

# 3. Verify schemas
psql -U ai_chat_user -d ai_chat_db -c "\dn"
```

---

## Troubleshooting

**Issue: n8n can't access database**
```bash
# Grant schema permissions
psql -U ai_chat_user -d ai_chat_db
GRANT ALL PRIVILEGES ON SCHEMA n8n TO ai_chat_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA n8n GRANT ALL ON TABLES TO ai_chat_user;
```

**Issue: Can't query app tables from n8n**
```bash
# Grant read access to public schema
GRANT USAGE ON SCHEMA public TO ai_chat_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ai_chat_user;
```

**Issue: Schema not being used**
```bash
# Check n8n environment variables
echo $DB_POSTGRESDB_SCHEMA

# Should output: n8n
```

---

## Final Recommendation

**Use: Same Database + Separate Schemas + Hybrid Approach**

This gives you:
- Simple infrastructure (one database)
- Clear separation (different schemas)
- Flexibility (n8n for complex AI logic)
- Full control (FastAPI for app logic)
- Easy debugging (all data in one place)

Good luck! 🚀
