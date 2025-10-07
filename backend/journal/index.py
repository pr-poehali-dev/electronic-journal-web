import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage schedule, homework, and grades for electronic journal
    Args: event with httpMethod, queryStringParameters (user_id, type), body for POST/PUT
          context with request_id
    Returns: HTTP response with journal data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    params = event.get('queryStringParameters', {}) or {}
    user_id = params.get('user_id')
    data_type = params.get('type')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id required'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    if method == 'GET':
        if data_type == 'schedule':
            cur.execute(
                "SELECT id, day_of_week, time_slot, subject, teacher, classroom FROM schedule WHERE user_id = %s ORDER BY day_of_week, time_slot",
                (user_id,)
            )
            rows = cur.fetchall()
            data = [
                {
                    'id': r[0],
                    'day_of_week': r[1],
                    'time_slot': r[2],
                    'subject': r[3],
                    'teacher': r[4],
                    'classroom': r[5]
                }
                for r in rows
            ]
        
        elif data_type == 'homework':
            cur.execute(
                "SELECT id, subject, description, due_date, completed FROM homework WHERE user_id = %s ORDER BY due_date",
                (user_id,)
            )
            rows = cur.fetchall()
            data = [
                {
                    'id': r[0],
                    'subject': r[1],
                    'description': r[2],
                    'due_date': r[3].isoformat() if r[3] else None,
                    'completed': r[4]
                }
                for r in rows
            ]
        
        elif data_type == 'grades':
            cur.execute(
                "SELECT id, subject, grade, grade_date, description FROM grades WHERE user_id = %s ORDER BY grade_date DESC",
                (user_id,)
            )
            rows = cur.fetchall()
            data = [
                {
                    'id': r[0],
                    'subject': r[1],
                    'grade': r[2],
                    'grade_date': r[3].isoformat() if r[3] else None,
                    'description': r[4]
                }
                for r in rows
            ]
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid type'})
            }
        
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'data': data})
        }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        
        if data_type == 'schedule':
            cur.execute(
                "INSERT INTO schedule (user_id, day_of_week, time_slot, subject, teacher, classroom) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (user_id, body_data['day_of_week'], body_data['time_slot'], body_data['subject'], body_data.get('teacher'), body_data.get('classroom'))
            )
        
        elif data_type == 'homework':
            cur.execute(
                "INSERT INTO homework (user_id, subject, description, due_date) VALUES (%s, %s, %s, %s) RETURNING id",
                (user_id, body_data['subject'], body_data['description'], body_data['due_date'])
            )
        
        elif data_type == 'grades':
            cur.execute(
                "INSERT INTO grades (user_id, subject, grade, grade_date, description) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (user_id, body_data['subject'], body_data['grade'], body_data['grade_date'], body_data.get('description'))
            )
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid type'})
            }
        
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'id': new_id})
        }
    
    elif method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        item_id = body_data.get('id')
        
        if not item_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'id required'})
            }
        
        if data_type == 'homework' and 'completed' in body_data:
            cur.execute(
                "UPDATE homework SET completed = %s WHERE id = %s AND user_id = %s",
                (body_data['completed'], item_id, user_id)
            )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
