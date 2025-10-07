import json
import os
import psycopg2
import hashlib
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication and registration for electronic journal
    Args: event with httpMethod, body (email, password, full_name for register)
          context with request_id
    Returns: HTTP response with user data or error
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    email = body_data.get('email', '').strip().lower()
    password = body_data.get('password', '')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email and password required'})
        }
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    if action == 'register':
        full_name = body_data.get('full_name', '').strip()
        if not full_name:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Full name required'})
            }
        
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User already exists'})
            }
        
        cur.execute(
            "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, %s) RETURNING id, email, full_name, role",
            (email, password_hash, full_name)
        )
        user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'full_name': user[2],
                    'role': user[3]
                }
            })
        }
    
    elif action == 'login':
        cur.execute(
            "SELECT id, email, full_name, role FROM users WHERE email = %s AND password_hash = %s",
            (email, password_hash)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'full_name': user[2],
                    'role': user[3]
                }
            })
        }
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid action'})
    }
