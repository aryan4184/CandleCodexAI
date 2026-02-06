# n8n AI Chat Workflow - Complete Step-by-Step Setup Guide

## Complete Node-by-Node Configuration

This guide will walk you through setting up every single node in your n8n AI chat workflow, with screenshots descriptions and exact configuration values.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Workflow Overview](#workflow-overview)
3. [Step-by-Step Node Setup](#step-by-step-node-setup)
4. [Testing the Workflow](#testing-the-workflow)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need Before Starting

✅ **n8n installed and running**
```bash
# Install n8n
npm install -g n8n

# Start n8n
n8n start

# Access at: http://localhost:5678
```

✅ **PostgreSQL database configured** with the schema from the main plan

✅ **AI API Key** - Choose one:
- Anthropic API Key (Claude) - Get from: https://console.anthropic.com/
- OpenAI API Key (GPT) - Get from: https://platform.openai.com/

✅ **Database credentials ready**:
- Host: localhost (or your DB host)
- Database: ai_chat_db
- User: ai_chat_user
- Password: your_password
- Port: 5432

---

## Workflow Overview

### Complete Workflow Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                         n8n Workflow Nodes                          │
└─────────────────────────────────────────────────────────────────────┘

1. Webhook                    → Receives POST request from FastAPI
       ↓
2. Parse & Validate Input     → Extracts session_id, message, validates
       ↓
3. Get Chat History (DB)      → Queries last 20 messages from PostgreSQL
       ↓
4. Format Messages for AI     → Builds proper message array
       ↓
5. Call AI API                → Sends to Claude/OpenAI
       ↓
6. Extract AI Response        → Parses API response
       ↓
7. Save AI Message (DB)       → Inserts assistant message to database
       ↓
8. Update Session (DB)        → Updates session timestamp
       ↓
9. Respond to Webhook         → Returns response to FastAPI
```

### Data Flow Example

**Input (from FastAPI):**
```json
{
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "What is machine learning?",
  "chat_history": []
}
```

**Output (to FastAPI):**
```json
{
  "response": "Machine learning is a subset of artificial intelligence...",
  "session_id": "123e4567-e89b-12d3-a456-426614174000",
  "message_id": "987fcdeb-51a2-43f1-b789-123456789abc",
  "tokens": 150
}
```

---

## Step-by-Step Node Setup

### STEP 1: Create New Workflow

1. Open n8n: `http://localhost:5678`
2. Click **"+ New Workflow"** (top right)
3. Name it: **"AI Chat Workflow"**
4. Click **Save** (Ctrl+S)

---

### NODE 1: Webhook Trigger

**Purpose:** Receives HTTP POST requests from your FastAPI backend

#### Configuration Steps:

1. **Add Node:**
   - Click the **"+"** button on canvas
   - Search for **"Webhook"**
   - Click **"Webhook"** to add it

2. **Configure Webhook:**
   - **HTTP Method:** `POST`
   - **Path:** `chat`
   - **Authentication:** `None` (we'll add later if needed)
   - **Response Mode:** `Last Node`
   - **Response Code:** `200`

3. **Detailed Settings:**

   Click on the node, then configure:

   ```
   ┌─────────────────────────────────────────┐
   │ Webhook Node Configuration              │
   ├─────────────────────────────────────────┤
   │                                         │
   │ HTTP Method: POST                       │
   │ Path: chat                              │
   │ Authentication: None                    │
   │ Response Mode: Last Node                │
   │ Response Code: 200                      │
   │                                         │
   │ Options (expand):                       │
   │ ☑ Binary Data: false                   │
   │ ☐ Raw Body: false                      │
   │ ☑ Response Data: JSON                  │
   │                                         │
   └─────────────────────────────────────────┘
   ```

4. **Get Your Webhook URL:**
   - After configuring, you'll see a **Production URL** and **Test URL**
   - Copy the **Production URL** (looks like: `http://localhost:5678/webhook/chat`)
   - Save this - you'll use it in FastAPI's `.env` file as `N8N_WEBHOOK_URL`

5. **Test the Webhook:**
   - Click **"Listen For Test Event"** button
   - Open a new terminal and run:
   ```bash
   curl -X POST http://localhost:5678/webhook-test/chat \
     -H "Content-Type: application/json" \
     -d '{
       "session_id": "test-123",
       "message": "Hello",
       "chat_history": []
     }'
   ```
   - You should see the data appear in n8n

---

### NODE 2: Parse & Validate Input

**Purpose:** Extract and validate the incoming webhook data

#### Configuration Steps:

1. **Add Node:**
   - Click the **"+"** button after Webhook node
   - Search for **"Code"**
   - Select **"Code"** node

2. **Configure Code Node:**
   - **Mode:** `Run Once for All Items`
   - **Language:** `JavaScript`

3. **Enter This Code:**

   ```javascript
   // Parse and validate incoming webhook data
   const body = $input.item.json.body;
   
   // Extract fields
   const sessionId = body.session_id;
   const userMessage = body.message;
   const chatHistory = body.chat_history || [];
   
   // Validation
   if (!sessionId) {
     throw new Error('Missing required field: session_id');
   }
   
   if (!userMessage || userMessage.trim().length === 0) {
     throw new Error('Missing or empty required field: message');
   }
   
   // UUID validation (optional but recommended)
   const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
   if (!uuidRegex.test(sessionId)) {
     throw new Error('Invalid session_id format (must be UUID)');
   }
   
   // Sanitize message (trim, limit length)
   const sanitizedMessage = userMessage.trim().substring(0, 10000);
   
   // Return cleaned data
   return {
     json: {
       session_id: sessionId,
       user_message: sanitizedMessage,
       chat_history: chatHistory,
       timestamp: new Date().toISOString()
     }
   };
   ```

4. **Node Settings:**
   ```
   ┌─────────────────────────────────────────┐
   │ Code Node Configuration                 │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: Parse & Validate Input            │
   │ Mode: Run Once for All Items            │
   │ Language: JavaScript                    │
   │                                         │
   └─────────────────────────────────────────┘
   ```

5. **Test the Node:**
   - Click **"Execute Node"**
   - Check output - should show:
   ```json
   {
     "session_id": "test-123",
     "user_message": "Hello",
     "chat_history": [],
     "timestamp": "2024-01-31T10:30:00.000Z"
   }
   ```

---

### NODE 3: PostgreSQL - Get Chat History

**Purpose:** Retrieve the last 20 messages from the database for context

#### Setup PostgreSQL Credentials First:

1. **Go to Credentials:**
   - Top menu: Click **"Credentials"** → **"New"**
   - Search for **"Postgres"**
   - Click **"Postgres account"**

2. **Enter Database Details:**
   ```
   ┌─────────────────────────────────────────┐
   │ PostgreSQL Credentials                  │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: AI Chat Database                  │
   │ Host: localhost                         │
   │ Database: ai_chat_db                    │
   │ User: ai_chat_user                      │
   │ Password: your_password                 │
   │ Port: 5432                              │
   │ Schema: public                          │
   │                                         │
   │ SSL: Disabled (or Enabled for prod)     │
   │                                         │
   └─────────────────────────────────────────┘
   ```

3. **Test Connection:**
   - Click **"Test Connection"**
   - Should show: ✅ **"Connection successful"**
   - Click **"Save"**

#### Configure PostgreSQL Node:

1. **Add Node:**
   - Click **"+"** after Parse & Validate node
   - Search for **"Postgres"**
   - Select **"Postgres"**

2. **Select Credentials:**
   - **Credential to connect with:** Select **"AI Chat Database"** (created above)

3. **Configure Query:**
   ```
   ┌─────────────────────────────────────────┐
   │ PostgreSQL Node Configuration           │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: Get Chat History                  │
   │ Operation: Execute Query                │
   │                                         │
   │ Query:                                  │
   │ SELECT role, content                    │
   │ FROM messages                           │
   │ WHERE session_id = $1                   │
   │ ORDER BY created_at ASC                 │
   │ LIMIT 20                                │
   │                                         │
   │ Query Parameters:                       │
   │ ={{ $json.session_id }}                 │
   │                                         │
   └─────────────────────────────────────────┘
   ```

4. **Exact Configuration:**

   **Operation:** `Execute Query`

   **Query:**
   ```sql
   SELECT role, content
   FROM messages
   WHERE session_id = $1
   ORDER BY created_at ASC
   LIMIT 20
   ```

   **Query Parameters:**
   ```
   ={{ $json.session_id }}
   ```

5. **Important Notes:**
   - The `$1` in the query is a PostgreSQL placeholder
   - It gets replaced with the value from Query Parameters
   - This prevents SQL injection
   - The `={{ $json.session_id }}` uses n8n's expression syntax

6. **Test the Node:**
   - Click **"Execute Node"**
   - If session has messages, you'll see them
   - If empty, you'll get an empty array (that's OK!)

---

### NODE 4: Format Messages for AI

**Purpose:** Build the proper message array format for AI API

#### Configuration Steps:

1. **Add Node:**
   - Click **"+"** after Get Chat History
   - Search for **"Code"**
   - Select **"Code"**

2. **Configure Code Node:**

   ```javascript
   // Get data from previous nodes
   const userMessage = $('Parse & Validate Input').item.json.user_message;
   const sessionId = $('Parse & Validate Input').item.json.session_id;
   
   // Get chat history from database query
   const dbHistory = $input.all();
   
   // System prompt - customize this for your use case
   const systemPrompt = {
     role: "system",
     content: "You are a helpful, friendly AI assistant. Provide clear, concise, and accurate responses. Be conversational but professional."
   };
   
   // Build messages array
   const messages = [systemPrompt];
   
   // Add chat history from database
   if (dbHistory && dbHistory.length > 0) {
     for (const item of dbHistory) {
       if (item.json.role && item.json.content) {
         messages.push({
           role: item.json.role,
           content: item.json.content
         });
       }
     }
   }
   
   // Add current user message
   messages.push({
     role: "user",
     content: userMessage
   });
   
   // Return formatted data
   return {
     json: {
       messages: messages,
       session_id: sessionId,
       user_message: userMessage,
       message_count: messages.length
     }
   };
   ```

3. **Node Settings:**
   ```
   ┌─────────────────────────────────────────┐
   │ Code Node Configuration                 │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: Format Messages for AI            │
   │ Mode: Run Once for All Items            │
   │ Language: JavaScript                    │
   │                                         │
   └─────────────────────────────────────────┘
   ```

4. **Expected Output:**
   ```json
   {
     "messages": [
       {
         "role": "system",
         "content": "You are a helpful..."
       },
       {
         "role": "user",
         "content": "Previous message"
       },
       {
         "role": "assistant",
         "content": "Previous response"
       },
       {
         "role": "user",
         "content": "What is machine learning?"
       }
     ],
     "session_id": "123e4567...",
     "user_message": "What is machine learning?",
     "message_count": 4
   }
   ```

---

### NODE 5: Call AI API (Anthropic Claude)

**Purpose:** Send messages to Claude API and get AI response

#### Setup Anthropic Credentials:

1. **Create API Credentials:**
   - Go to **Credentials** → **New**
   - Search for **"HTTP Request"** credentials (we'll use generic HTTP)
   - Name it: **"Anthropic API"**

2. **Configure Header Auth:**
   ```
   ┌─────────────────────────────────────────┐
   │ HTTP Header Auth Credentials            │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: Anthropic API                     │
   │ Auth Type: Header Auth                  │
   │                                         │
   │ Header Name: x-api-key                  │
   │ Header Value: sk-ant-xxxxxxxxxxxxx      │
   │                                         │
   └─────────────────────────────────────────┘
   ```
   - Replace `sk-ant-xxxxxxxxxxxxx` with your actual Anthropic API key

#### Configure HTTP Request Node:

1. **Add Node:**
   - Click **"+"** after Format Messages
   - Search for **"HTTP Request"**
   - Select **"HTTP Request"**

2. **Basic Settings:**
   ```
   ┌─────────────────────────────────────────┐
   │ HTTP Request Node - Basic               │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: Call Claude API                   │
   │ Method: POST                            │
   │ URL: https://api.anthropic.com/v1/messages
   │                                         │
   │ Authentication: Predefined Credential   │
   │ Credential Type: Header Auth            │
   │ Credential: Anthropic API               │
   │                                         │
   └─────────────────────────────────────────┘
   ```

3. **Headers:**
   - Click **"Add Parameter"** under Headers
   - Add these headers:

   | Name | Value |
   |------|-------|
   | `anthropic-version` | `2023-06-01` |
   | `Content-Type` | `application/json` |

4. **Body (JSON):**
   - **Send Body:** Yes
   - **Body Content Type:** JSON
   - **Specify Body:** Using JSON

   Click **"Add Field"** and enter this JSON:

   ```json
   {
     "model": "claude-3-5-sonnet-20241022",
     "max_tokens": 4096,
     "messages": "={{ $json.messages }}"
   }
   ```

5. **Complete Configuration Visual:**
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ HTTP Request Node - Complete Setup                         │
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │ Authentication: Predefined Credential                       │
   │   └─ Header Auth: Anthropic API                            │
   │                                                             │
   │ Method: POST                                                │
   │ URL: https://api.anthropic.com/v1/messages                  │
   │                                                             │
   │ Headers:                                                    │
   │   - anthropic-version: 2023-06-01                          │
   │   - Content-Type: application/json                         │
   │                                                             │
   │ Body:                                                       │
   │   {                                                         │
   │     "model": "claude-3-5-sonnet-20241022",                 │
   │     "max_tokens": 4096,                                    │
   │     "messages": "={{ $json.messages }}"                    │
   │   }                                                         │
   │                                                             │
   │ Options:                                                    │
   │   - Response Format: JSON                                  │
   │   - Timeout: 60000                                         │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
   ```

6. **Options (click "Add Option"):**
   - **Timeout:** `60000` (60 seconds)
   - **Response Format:** Autodetect (or JSON)

7. **Test the Node:**
   - Click **"Execute Node"**
   - You should get a response like:
   ```json
   {
     "id": "msg_xxxxx",
     "type": "message",
     "role": "assistant",
     "content": [
       {
         "type": "text",
         "text": "Machine learning is a subset of artificial intelligence..."
       }
     ],
     "model": "claude-3-5-sonnet-20241022",
     "usage": {
       "input_tokens": 25,
       "output_tokens": 150
     }
   }
   ```

---

### NODE 5 (Alternative): Call OpenAI API

**If you prefer OpenAI instead of Claude:**

#### Setup OpenAI Credentials:

1. **Create Credentials:**
   - **Credentials** → **New**
   - Search **"OpenAI"**
   - Select **"OpenAI API"**

2. **Enter API Key:**
   ```
   ┌─────────────────────────────────────────┐
   │ OpenAI Credentials                      │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: OpenAI API                        │
   │ API Key: sk-xxxxxxxxxxxxxxx             │
   │                                         │
   └─────────────────────────────────────────┘
   ```

#### Configure OpenAI Chat Node:

1. **Add Node:**
   - Click **"+"** after Format Messages
   - Search for **"OpenAI"**
   - Select **"OpenAI Chat Model"**

2. **Configuration:**
   ```
   ┌─────────────────────────────────────────┐
   │ OpenAI Chat Node                        │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Credentials: OpenAI API                 │
   │ Model: gpt-4-turbo-preview              │
   │                                         │
   │ Messages:                               │
   │ ={{ $json.messages }}                   │
   │                                         │
   │ Options:                                │
   │ - Temperature: 0.7                      │
   │ - Max Tokens: 4096                      │
   │                                         │
   └─────────────────────────────────────────┘
   ```

---

### NODE 6: Extract AI Response

**Purpose:** Parse the AI response and extract the text + metadata

#### Configuration Steps:

1. **Add Node:**
   - Click **"+"** after Call Claude/OpenAI
   - Search for **"Code"**
   - Select **"Code"**

2. **Enter This Code:**

   **For Claude (Anthropic):**
   ```javascript
   // Get the AI response from Claude
   const claudeResponse = $input.item.json;
   
   // Extract response text
   let aiResponse = '';
   let tokenCount = 0;
   
   if (claudeResponse.content && claudeResponse.content.length > 0) {
     // Claude returns content as an array
     aiResponse = claudeResponse.content[0].text;
     tokenCount = claudeResponse.usage?.output_tokens || 0;
   } else {
     throw new Error('No response content from Claude API');
   }
   
   // Get session info from earlier node
   const sessionId = $('Format Messages for AI').item.json.session_id;
   const userMessage = $('Format Messages for AI').item.json.user_message;
   
   // Return structured data
   return {
     json: {
       ai_response: aiResponse,
       session_id: sessionId,
       user_message: userMessage,
       token_count: tokenCount,
       model: claudeResponse.model,
       timestamp: new Date().toISOString(),
       raw_usage: claudeResponse.usage
     }
   };
   ```

   **For OpenAI (if using):**
   ```javascript
   // Get the AI response from OpenAI
   const openaiResponse = $input.item.json;
   
   // Extract response text
   let aiResponse = '';
   let tokenCount = 0;
   
   if (openaiResponse.choices && openaiResponse.choices.length > 0) {
     aiResponse = openaiResponse.choices[0].message.content;
     tokenCount = openaiResponse.usage?.completion_tokens || 0;
   } else {
     throw new Error('No response from OpenAI API');
   }
   
   // Get session info
   const sessionId = $('Format Messages for AI').item.json.session_id;
   const userMessage = $('Format Messages for AI').item.json.user_message;
   
   return {
     json: {
       ai_response: aiResponse,
       session_id: sessionId,
       user_message: userMessage,
       token_count: tokenCount,
       model: openaiResponse.model,
       timestamp: new Date().toISOString()
     }
   };
   ```

3. **Node Settings:**
   ```
   ┌─────────────────────────────────────────┐
   │ Code Node Configuration                 │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: Extract AI Response               │
   │ Mode: Run Once for All Items            │
   │ Language: JavaScript                    │
   │                                         │
   └─────────────────────────────────────────┘
   ```

4. **Expected Output:**
   ```json
   {
     "ai_response": "Machine learning is a subset of AI...",
     "session_id": "123e4567-e89b-12d3-a456-426614174000",
     "user_message": "What is machine learning?",
     "token_count": 150,
     "model": "claude-3-5-sonnet-20241022",
     "timestamp": "2024-01-31T10:35:00.000Z"
   }
   ```

---

### NODE 7: Save AI Response to Database

**Purpose:** Insert the assistant's message into the messages table

#### Configuration Steps:

1. **Add Node:**
   - Click **"+"** after Extract AI Response
   - Search for **"Postgres"**
   - Select **"Postgres"**

2. **Select Credentials:**
   - **Credential:** AI Chat Database (created in Node 3)

3. **Configure Insert:**
   ```
   ┌─────────────────────────────────────────┐
   │ PostgreSQL Node - Insert                │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: Save AI Response                  │
   │ Operation: Execute Query                │
   │                                         │
   │ Query:                                  │
   │ INSERT INTO messages                    │
   │   (session_id, role, content,           │
   │    token_count, created_at)             │
   │ VALUES                                  │
   │   ($1, 'assistant', $2, $3, NOW())      │
   │ RETURNING id, created_at;               │
   │                                         │
   │ Query Parameters:                       │
   │ ={{ $json.session_id }},                │
   │ ={{ $json.ai_response }},               │
   │ ={{ $json.token_count }}                │
   │                                         │
   └─────────────────────────────────────────┘
   ```

4. **Exact Values:**

   **Operation:** `Execute Query`

   **Query:**
   ```sql
   INSERT INTO messages 
     (session_id, role, content, token_count, created_at)
   VALUES 
     ($1, 'assistant', $2, $3, NOW())
   RETURNING id, created_at;
   ```

   **Query Parameters:**
   ```
   ={{ $json.session_id }}, ={{ $json.ai_response }}, ={{ $json.token_count }}
   ```

5. **Important Notes:**
   - Parameters are comma-separated
   - `$1`, `$2`, `$3` correspond to the three parameters in order
   - `RETURNING` clause sends back the new message ID
   - This is useful for returning to FastAPI

6. **Test the Node:**
   - Click **"Execute Node"**
   - Should return:
   ```json
   {
     "id": "987fcdeb-51a2-43f1-b789-123456789abc",
     "created_at": "2024-01-31T10:35:00.000Z"
   }
   ```

---

### NODE 8: Update Session Timestamp

**Purpose:** Update the session's updated_at field to show recent activity

#### Configuration Steps:

1. **Add Node:**
   - Click **"+"** after Save AI Response
   - Search for **"Postgres"**
   - Select **"Postgres"**

2. **Configure Update:**
   ```
   ┌─────────────────────────────────────────┐
   │ PostgreSQL Node - Update                │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: Update Session                    │
   │ Operation: Execute Query                │
   │                                         │
   │ Query:                                  │
   │ UPDATE sessions                         │
   │ SET updated_at = NOW()                  │
   │ WHERE id = $1;                          │
   │                                         │
   │ Query Parameters:                       │
   │ ={{ $('Extract AI Response').item.json.session_id }}
   │                                         │
   └─────────────────────────────────────────┘
   ```

3. **Exact Values:**

   **Operation:** `Execute Query`

   **Query:**
   ```sql
   UPDATE sessions
   SET updated_at = NOW()
   WHERE id = $1;
   ```

   **Query Parameters:**
   ```
   ={{ $('Extract AI Response').item.json.session_id }}
   ```

   Note: We reference the Extract AI Response node to get session_id

---

### NODE 9: Build Final Response

**Purpose:** Create a clean response object to send back to FastAPI

#### Configuration Steps:

1. **Add Node:**
   - Click **"+"** after Update Session
   - Search for **"Code"**
   - Select **"Code"**

2. **Enter This Code:**

   ```javascript
   // Get all the data we need from previous nodes
   const aiResponseData = $('Extract AI Response').item.json;
   const savedMessage = $('Save AI Response').item.json;
   
   // Build response object for FastAPI
   const response = {
     response: aiResponseData.ai_response,
     session_id: aiResponseData.session_id,
     message_id: savedMessage.id,
     token_count: aiResponseData.token_count,
     created_at: savedMessage.created_at,
     model: aiResponseData.model,
     success: true
   };
   
   return {
     json: response
   };
   ```

3. **Node Settings:**
   ```
   ┌─────────────────────────────────────────┐
   │ Code Node Configuration                 │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: Build Final Response              │
   │ Mode: Run Once for All Items            │
   │ Language: JavaScript                    │
   │                                         │
   └─────────────────────────────────────────┘
   ```

4. **Expected Output:**
   ```json
   {
     "response": "Machine learning is a subset of artificial intelligence...",
     "session_id": "123e4567-e89b-12d3-a456-426614174000",
     "message_id": "987fcdeb-51a2-43f1-b789-123456789abc",
     "token_count": 150,
     "created_at": "2024-01-31T10:35:00.000Z",
     "model": "claude-3-5-sonnet-20241022",
     "success": true
   }
   ```

---

### NODE 10: Respond to Webhook

**Purpose:** Send the response back to FastAPI

#### Configuration Steps:

1. **Add Node:**
   - Click **"+"** after Build Final Response
   - Search for **"Respond to Webhook"**
   - Select **"Respond to Webhook"**

2. **Configure Response:**
   ```
   ┌─────────────────────────────────────────┐
   │ Respond to Webhook Node                 │
   ├─────────────────────────────────────────┤
   │                                         │
   │ Name: Respond to Webhook                │
   │ Respond With: Using Fields Below        │
   │                                         │
   │ Response Code: 200                      │
   │                                         │
   │ Response Headers (optional):            │
   │ Content-Type: application/json          │
   │                                         │
   │ Response Body: Automatically            │
   │                                         │
   └─────────────────────────────────────────┘
   ```

3. **Settings:**
   - **Respond With:** `Using Fields Below`
   - **Response Code:** `200`
   - Leave **Response Body** as automatic (it will use the JSON from previous node)

4. **Add Response Header (Optional but Recommended):**
   - Click **"Add Option"** → **"Response Headers"**
   - Click **"Add Response Header"**
   - **Name:** `Content-Type`
   - **Value:** `application/json`

---

### NODE 11 (OPTIONAL): Error Handling

**Purpose:** Catch and handle errors gracefully

#### Add Error Handler:

1. **Click on any node** (e.g., Call Claude API)
2. Click the **settings icon** (gear) on the node
3. Go to **"Error Workflow"** section
4. Toggle **"Continue On Fail"**

Or create a dedicated error workflow:

1. **Add Node:**
   - After Call Claude API, add a second output
   - Search for **"If"**
   - Create condition to check for errors

2. **Error Response Code:**
   ```javascript
   // In a separate Code node for error path
   const errorMessage = $node["Call Claude API"].json.error || "Unknown error occurred";
   
   return {
     json: {
       response: "I apologize, but I encountered an error processing your request. Please try again.",
       session_id: $('Parse & Validate Input').item.json.session_id,
       error: errorMessage,
       success: false
     }
   };
   ```

---

## Complete Workflow Summary

### Final Node List

```
1. ✅ Webhook                    (Receives request)
2. ✅ Parse & Validate Input     (Validates data)
3. ✅ Get Chat History           (PostgreSQL query)
4. ✅ Format Messages for AI     (Build message array)
5. ✅ Call Claude API            (Get AI response)
6. ✅ Extract AI Response        (Parse response)
7. ✅ Save AI Response           (Insert to DB)
8. ✅ Update Session             (Update timestamp)
9. ✅ Build Final Response       (Format response)
10. ✅ Respond to Webhook        (Return to FastAPI)
```

### Visual Connection Flow

```
Webhook
  │
  ├─→ Parse & Validate Input
        │
        ├─→ Get Chat History (PostgreSQL)
              │
              ├─→ Format Messages for AI
                    │
                    ├─→ Call Claude API
                          │
                          ├─→ Extract AI Response
                                │
                                ├─→ Save AI Response (PostgreSQL)
                                      │
                                      ├─→ Update Session (PostgreSQL)
                                            │
                                            ├─→ Build Final Response
                                                  │
                                                  └─→ Respond to Webhook
```

---

## Testing the Workflow

### Test 1: Manual Test in n8n

1. **Click on Webhook node**
2. Click **"Listen For Test Event"**
3. **Open terminal and run:**

   ```bash
   curl -X POST http://localhost:5678/webhook-test/chat \
     -H "Content-Type: application/json" \
     -d '{
       "session_id": "123e4567-e89b-12d3-a456-426614174000",
       "message": "What is artificial intelligence?",
       "chat_history": []
     }'
   ```

4. **Watch the workflow execute**
   - Each node should light up green as it executes
   - Check each node's output by clicking on it

5. **Expected Response:**
   ```json
   {
     "response": "Artificial intelligence (AI) is...",
     "session_id": "123e4567-e89b-12d3-a456-426614174000",
     "message_id": "...",
     "token_count": 200,
     "success": true
   }
   ```

### Test 2: Check Database

```sql
-- Check if message was saved
SELECT * FROM messages 
WHERE session_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY created_at DESC
LIMIT 5;

-- Should show both user and assistant messages
```

### Test 3: Test from FastAPI

1. **Make sure FastAPI is configured** with the webhook URL:
   ```env
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
   ```

2. **Start FastAPI:**
   ```bash
   uvicorn app.main:app --reload
   ```

3. **Test the endpoint:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/messages/chat \
     -H "Content-Type: application/json" \
     -d '{
       "session_id": "123e4567-e89b-12d3-a456-426614174000",
       "message": "Explain quantum computing"
     }'
   ```

---

## Activating the Workflow

### Make Workflow Live

1. **Save the workflow** (Ctrl+S)

2. **Activate it:**
   - Toggle the **"Inactive/Active"** switch in top right
   - Should turn **green** when active
   - The webhook is now listening for production requests

3. **Get Production Webhook URL:**
   - Click on Webhook node
   - Copy the **Production URL** (not Test URL)
   - Use this in your FastAPI `.env` file

---

## Troubleshooting

### Issue: "Workflow did not run"

**Solution:**
- Make sure workflow is **Active** (toggle in top right)
- Check the webhook URL is correct
- Verify n8n is running

### Issue: "Database connection failed"

**Solution:**
```bash
# Test PostgreSQL connection
psql -U ai_chat_user -d ai_chat_db -c "SELECT 1;"

# Check credentials in n8n match your database
```

### Issue: "AI API returned error"

**Solution:**
- Verify API key is correct
- Check API quota/limits
- Look at error message in node output
- For Claude: Check https://console.anthropic.com/
- For OpenAI: Check https://platform.openai.com/

### Issue: "Cannot read property of undefined"

**Solution:**
- A previous node didn't execute
- Check which node has the error (red outline)
- Click on it to see error details
- Make sure all connections are proper

### Issue: "SQL syntax error"

**Solution:**
- Check Query Parameters format
- Make sure placeholders ($1, $2) match parameter count
- Verify table/column names match your schema

---

## Advanced Configuration

### Add Streaming Support (Optional)

If you want to stream AI responses:

1. **Modify Call Claude API node:**
   - Add to body: `"stream": true`
   - Handle streaming in a custom code node

2. **Update Respond to Webhook:**
   - Use streaming response mode

### Add Rate Limiting

```javascript
// In Parse & Validate Input node
const sessionId = body.session_id;

// Check rate limit (pseudo-code)
const requestCount = await checkRateLimit(sessionId);
if (requestCount > 10) {
  throw new Error('Rate limit exceeded. Please try again later.');
}
```

### Add Conversation Memory

Store conversation summaries for long contexts:

```javascript
// In Format Messages node
// If history is too long, summarize older messages
if (messages.length > 40) {
  // Call Claude to summarize first 20 messages
  // Replace them with summary
}
```

---

## Monitoring & Logs

### View Execution History

1. **Go to "Executions"** in left sidebar
2. See all workflow runs
3. Click any execution to see:
   - Input data
   - Output from each node
   - Execution time
   - Any errors

### Enable Debug Mode

1. **Click workflow settings** (gear icon top right)
2. Enable **"Save Execution Progress"**
3. Set **"Save Data of Successful Executions"**

---

## Next Steps

✅ Workflow is now complete and ready to use!

**To integrate with your app:**

1. Make sure workflow is **Active**
2. Copy the **Production Webhook URL**
3. Update FastAPI's `.env` with:
   ```
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
   ```
4. Start FastAPI and test!

**Additional Enhancements:**
- Add authentication to webhook
- Implement retry logic
- Add monitoring/alerting
- Set up backup workflows
- Add A/B testing for different prompts

Good luck! 🚀
