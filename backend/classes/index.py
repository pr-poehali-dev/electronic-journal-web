import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage classes and students for teachers
    Args: event with httpMethod, queryStringParameters (teacher_id, class_id), body for POST
          context with request_id
    Returns: HTTP response with classes and students data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    params = event.get('queryStringParameters', {}) or {}
    teacher_id = params.get('teacher_id')
    class_id = params.get('class_id')
    action = params.get('action')
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    if method == 'GET':
        if action == 'students' and class_id:
            cur.execute("""
                SELECT u.id, u.email, u.full_name, u.role 
                FROM users u
                JOIN class_students cs ON u.id = cs.student_id
                WHERE cs.class_id = %s
                ORDER BY u.full_name
            """, (class_id,))
            rows = cur.fetchall()
            students = [
                {'id': r[0], 'email': r[1], 'full_name': r[2], 'role': r[3]}
                for r in rows
            ]
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'students': students})
            }
        
        elif action == 'all_students':
            cur.execute("""
                SELECT id, email, full_name 
                FROM users 
                WHERE role = 'student'
                ORDER BY full_name
            """)
            rows = cur.fetchall()
            students = [
                {'id': r[0], 'email': r[1], 'full_name': r[2]}
                for r in rows
            ]
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'students': students})
            }
        
        elif teacher_id:
            cur.execute("""
                SELECT id, name, teacher_id, created_at
                FROM classes
                WHERE teacher_id = %s
                ORDER BY name
            """, (teacher_id,))
            rows = cur.fetchall()
            classes = []
            
            for r in rows:
                class_id = r[0]
                cur.execute("""
                    SELECT COUNT(*) FROM class_students WHERE class_id = %s
                """, (class_id,))
                student_count = cur.fetchone()[0]
                
                classes.append({
                    'id': r[0],
                    'name': r[1],
                    'teacher_id': r[2],
                    'created_at': r[3].isoformat() if r[3] else None,
                    'student_count': student_count
                })
            
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'classes': classes})
            }
        
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'teacher_id required'})
        }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'create_class':
            if not teacher_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'teacher_id required'})
                }
            
            class_name = body_data.get('name', '').strip()
            if not class_name:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Class name required'})
                }
            
            cur.execute(
                "INSERT INTO classes (name, teacher_id) VALUES (%s, %s) RETURNING id",
                (class_name, teacher_id)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': new_id, 'name': class_name})
            }
        
        elif action == 'add_student':
            class_id = body_data.get('class_id')
            student_id = body_data.get('student_id')
            
            if not class_id or not student_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'class_id and student_id required'})
                }
            
            cur.execute(
                "SELECT id FROM class_students WHERE class_id = %s AND student_id = %s",
                (class_id, student_id)
            )
            if cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Student already in class'})
                }
            
            cur.execute(
                "INSERT INTO class_students (class_id, student_id) VALUES (%s, %s) RETURNING id",
                (class_id, student_id)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': new_id})
            }
        
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid action'})
        }
    
    elif method == 'DELETE':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'remove_student':
            class_id = body_data.get('class_id')
            student_id = body_data.get('student_id')
            
            if not class_id or not student_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'class_id and student_id required'})
                }
            
            cur.execute(
                "SELECT id FROM class_students WHERE class_id = %s AND student_id = %s",
                (class_id, student_id)
            )
            row = cur.fetchone()
            if row:
                cur.execute(
                    "UPDATE class_students SET student_id = NULL WHERE id = %s",
                    (row[0],)
                )
                conn.commit()
            
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid action'})
        }
    
    cur.close()
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
