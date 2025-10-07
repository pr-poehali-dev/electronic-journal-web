import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CLASSES_URL = 'https://functions.poehali.dev/af917182-8991-4be1-979a-e8d2f5cbee45';
const JOURNAL_URL = 'https://functions.poehali.dev/7ead2d05-255b-4d1c-a687-6fdbfd49366c';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Class {
  id: number;
  name: string;
  teacher_id: number;
  student_count: number;
}

interface Student {
  id: number;
  email: string;
  full_name: string;
  role?: string;
}

interface Homework {
  id: number;
  subject: string;
  description: string;
  due_date: string;
  user_id?: number;
}

interface Grade {
  id: number;
  subject: string;
  grade: number;
  grade_date: string;
  description?: string;
  user_id?: number;
}

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
}

const TeacherDashboard = ({ user, onLogout }: TeacherDashboardProps) => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [classHomework, setClassHomework] = useState<Homework[]>([]);
  const [classGrades, setClassGrades] = useState<Grade[]>([]);
  
  const [newClassName, setNewClassName] = useState('');
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  const [newHomework, setNewHomework] = useState({
    subject: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    student_id: ''
  });
  
  const [newGrade, setNewGrade] = useState({
    subject: '',
    grade: 5,
    grade_date: new Date().toISOString().split('T')[0],
    description: '',
    student_id: ''
  });

  useEffect(() => {
    loadClasses();
    loadAllStudents();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassStudents(selectedClass.id);
      loadClassHomework(selectedClass.id);
      loadClassGrades(selectedClass.id);
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    const res = await fetch(`${CLASSES_URL}?teacher_id=${user.id}`);
    const data = await res.json();
    setClasses(data.classes || []);
  };

  const loadAllStudents = async () => {
    const res = await fetch(`${CLASSES_URL}?action=all_students`);
    const data = await res.json();
    setAllStudents(data.students || []);
  };

  const loadClassStudents = async (classId: number) => {
    const res = await fetch(`${CLASSES_URL}?action=students&class_id=${classId}`);
    const data = await res.json();
    setClassStudents(data.students || []);
  };

  const loadClassHomework = async (classId: number) => {
    const res = await fetch(`${JOURNAL_URL}?class_id=${classId}&type=homework`);
    const data = await res.json();
    setClassHomework(data.data || []);
  };

  const loadClassGrades = async (classId: number) => {
    const res = await fetch(`${JOURNAL_URL}?class_id=${classId}&type=grades`);
    const data = await res.json();
    setClassGrades(data.data || []);
  };

  const createClass = async () => {
    if (!newClassName.trim()) return;
    
    await fetch(`${CLASSES_URL}?teacher_id=${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_class', name: newClassName })
    });
    
    setNewClassName('');
    setIsAddClassOpen(false);
    loadClasses();
    toast({ title: 'Класс создан' });
  };

  const addStudentToClass = async () => {
    if (!selectedClass || !selectedStudentId) return;
    
    await fetch(`${CLASSES_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_student',
        class_id: selectedClass.id,
        student_id: parseInt(selectedStudentId)
      })
    });
    
    setSelectedStudentId('');
    setIsAddStudentOpen(false);
    loadClassStudents(selectedClass.id);
    loadClasses();
    toast({ title: 'Ученик добавлен в класс' });
  };

  const addHomeworkToStudent = async () => {
    if (!selectedClass || !newHomework.student_id || !newHomework.subject || !newHomework.description) return;
    
    await fetch(`${JOURNAL_URL}?user_id=${user.id}&type=homework`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(newHomework.student_id),
        subject: newHomework.subject,
        description: newHomework.description,
        due_date: newHomework.due_date,
        class_id: selectedClass.id,
        teacher_id: user.id
      })
    });
    
    setNewHomework({
      subject: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      student_id: ''
    });
    loadClassHomework(selectedClass.id);
    toast({ title: 'Домашнее задание добавлено' });
  };

  const addGradeToStudent = async () => {
    if (!selectedClass || !newGrade.student_id || !newGrade.subject) return;
    
    await fetch(`${JOURNAL_URL}?user_id=${user.id}&type=grades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(newGrade.student_id),
        subject: newGrade.subject,
        grade: newGrade.grade,
        grade_date: newGrade.grade_date,
        description: newGrade.description,
        class_id: selectedClass.id,
        teacher_id: user.id
      })
    });
    
    setNewGrade({
      subject: '',
      grade: 5,
      grade_date: new Date().toISOString().split('T')[0],
      description: '',
      student_id: ''
    });
    loadClassGrades(selectedClass.id);
    toast({ title: 'Оценка выставлена' });
  };

  const getStudentName = (studentId: number) => {
    const student = classStudents.find(s => s.id === studentId);
    return student?.full_name || 'Неизвестный ученик';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Icon name="GraduationCap" size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Электронный Журнал Веб</h1>
              <p className="text-sm text-muted-foreground">{user.full_name} • Учитель</p>
            </div>
          </div>
          <Button onClick={onLogout} variant="outline" size="sm">
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="lg:col-span-1 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Мои классы</CardTitle>
              <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Icon name="Plus" size={16} />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Создать новый класс</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Название класса</Label>
                      <Input
                        placeholder="10А"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                      />
                    </div>
                    <Button onClick={createClass} className="w-full">Создать</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              {classes.map((cls) => (
                <Button
                  key={cls.id}
                  variant={selectedClass?.id === cls.id ? 'default' : 'outline'}
                  className="w-full justify-between"
                  onClick={() => setSelectedClass(cls)}
                >
                  <span>{cls.name}</span>
                  <Badge variant="secondary">{cls.student_count}</Badge>
                </Button>
              ))}
              {classes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Нет классов. Создайте первый класс.
                </p>
              )}
            </CardContent>
          </Card>

          {selectedClass ? (
            <div className="lg:col-span-3">
              <Tabs defaultValue="students" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="students">
                    <Icon name="Users" size={18} className="mr-2" />
                    Ученики
                  </TabsTrigger>
                  <TabsTrigger value="homework">
                    <Icon name="BookMarked" size={18} className="mr-2" />
                    Домашние задания
                  </TabsTrigger>
                  <TabsTrigger value="grades">
                    <Icon name="Award" size={18} className="mr-2" />
                    Оценки
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="space-y-4">
                  <Card className="shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Ученики класса {selectedClass.name}</CardTitle>
                      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Icon name="Plus" size={16} className="mr-2" />
                            Добавить ученика
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Добавить ученика в класс</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Выберите ученика</Label>
                              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите ученика" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allStudents
                                    .filter(s => !classStudents.find(cs => cs.id === s.id))
                                    .map((student) => (
                                      <SelectItem key={student.id} value={student.id.toString()}>
                                        {student.full_name} ({student.email})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={addStudentToClass} className="w-full">
                              Добавить
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {classStudents.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 p-2 rounded-full">
                                <Icon name="User" size={20} className="text-primary" />
                              </div>
                              <div>
                                <div className="font-semibold">{student.full_name}</div>
                                <div className="text-sm text-muted-foreground">{student.email}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {classStudents.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            В классе пока нет учеников
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="homework" className="space-y-4">
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle>Выдать домашнее задание</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Ученик</Label>
                        <Select value={newHomework.student_id} onValueChange={(val) => setNewHomework({ ...newHomework, student_id: val })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите ученика" />
                          </SelectTrigger>
                          <SelectContent>
                            {classStudents.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Предмет</Label>
                        <Input
                          placeholder="Математика"
                          value={newHomework.subject}
                          onChange={(e) => setNewHomework({ ...newHomework, subject: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Описание</Label>
                        <Textarea
                          placeholder="Задачи 1-10, стр. 45"
                          value={newHomework.description}
                          onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Срок сдачи</Label>
                        <Input
                          type="date"
                          value={newHomework.due_date}
                          onChange={(e) => setNewHomework({ ...newHomework, due_date: e.target.value })}
                        />
                      </div>
                      <Button onClick={addHomeworkToStudent} className="w-full">
                        <Icon name="Plus" size={16} className="mr-2" />
                        Выдать задание
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    {classHomework.map((item) => (
                      <Card key={item.id} className="shadow-md">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{getStudentName(item.user_id!)}</Badge>
                                <Badge>{new Date(item.due_date).toLocaleDateString('ru-RU')}</Badge>
                              </div>
                              <div className="font-semibold text-lg">{item.subject}</div>
                              <p className="text-sm mt-1">{item.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {classHomework.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Домашних заданий пока нет
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="grades" className="space-y-4">
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle>Выставить оценку</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ученик</Label>
                          <Select value={newGrade.student_id} onValueChange={(val) => setNewGrade({ ...newGrade, student_id: val })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите ученика" />
                            </SelectTrigger>
                            <SelectContent>
                              {classStudents.map((student) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                  {student.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Предмет</Label>
                          <Input
                            placeholder="Математика"
                            value={newGrade.subject}
                            onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Оценка</Label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                            value={newGrade.grade}
                            onChange={(e) => setNewGrade({ ...newGrade, grade: parseInt(e.target.value) })}
                          >
                            {[5, 4, 3, 2].map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Дата</Label>
                          <Input
                            type="date"
                            value={newGrade.grade_date}
                            onChange={(e) => setNewGrade({ ...newGrade, grade_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Примечание</Label>
                          <Input
                            placeholder="Контрольная работа"
                            value={newGrade.description}
                            onChange={(e) => setNewGrade({ ...newGrade, description: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button onClick={addGradeToStudent} className="w-full">
                        <Icon name="Plus" size={16} className="mr-2" />
                        Выставить оценку
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    {classGrades.map((item) => (
                      <Card key={item.id} className="shadow-md">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                                  item.grade === 5
                                    ? 'bg-green-100 text-green-700'
                                    : item.grade === 4
                                    ? 'bg-blue-100 text-blue-700'
                                    : item.grade === 3
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {item.grade}
                              </div>
                              <div>
                                <div className="font-semibold text-lg">{item.subject}</div>
                                <div className="text-sm text-muted-foreground">
                                  {getStudentName(item.user_id!)}
                                  {item.description && ` • ${item.description}`}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {new Date(item.grade_date).toLocaleDateString('ru-RU')}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {classGrades.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Оценок пока нет
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="lg:col-span-3 flex items-center justify-center">
              <Card className="shadow-md">
                <CardContent className="pt-6 text-center">
                  <Icon name="GraduationCap" size={64} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">Выберите класс</p>
                  <p className="text-sm text-muted-foreground">
                    Выберите класс из списка слева или создайте новый
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
