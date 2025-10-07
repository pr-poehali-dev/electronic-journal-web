import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import TeacherDashboard from '@/components/TeacherDashboard';

const AUTH_URL = 'https://functions.poehali.dev/4626bb13-e2e7-47da-8489-eaf34a169841';
const JOURNAL_URL = 'https://functions.poehali.dev/7ead2d05-255b-4d1c-a687-6fdbfd49366c';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Schedule {
  id: number;
  day_of_week: number;
  time_slot: string;
  subject: string;
  teacher?: string;
  classroom?: string;
}

interface Homework {
  id: number;
  subject: string;
  description: string;
  due_date: string;
  completed: boolean;
}

interface Grade {
  id: number;
  subject: string;
  grade: number;
  grade_date: string;
  description?: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 1,
    time_slot: '08:00',
    subject: '',
    teacher: '',
    classroom: ''
  });

  const [newHomework, setNewHomework] = useState({
    subject: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0]
  });

  const [newGrade, setNewGrade] = useState({
    subject: '',
    grade: 5,
    grade_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSchedule();
      loadHomework();
      loadGrades();
    }
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const action = isLogin ? 'login' : 'register';
    const body: any = { action, email, password };
    if (!isLogin) body.full_name = fullName;

    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast({
        title: isLogin ? 'Вход выполнен' : 'Регистрация завершена',
        description: `Добро пожаловать, ${data.user.full_name}!`
      });
    } else {
      toast({
        title: 'Ошибка',
        description: data.error || 'Произошла ошибка',
        variant: 'destructive'
      });
    }
  };

  const loadSchedule = async () => {
    if (!user) return;
    const res = await fetch(`${JOURNAL_URL}?user_id=${user.id}&type=schedule`);
    const data = await res.json();
    setSchedule(data.data || []);
  };

  const loadHomework = async () => {
    if (!user) return;
    const res = await fetch(`${JOURNAL_URL}?user_id=${user.id}&type=homework`);
    const data = await res.json();
    setHomework(data.data || []);
  };

  const loadGrades = async () => {
    if (!user) return;
    const res = await fetch(`${JOURNAL_URL}?user_id=${user.id}&type=grades`);
    const data = await res.json();
    setGrades(data.data || []);
  };

  const addSchedule = async () => {
    if (!user || !newSchedule.subject) return;
    
    await fetch(`${JOURNAL_URL}?user_id=${user.id}&type=schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSchedule)
    });

    setNewSchedule({
      day_of_week: 1,
      time_slot: '08:00',
      subject: '',
      teacher: '',
      classroom: ''
    });
    loadSchedule();
    toast({ title: 'Урок добавлен в расписание' });
  };

  const addHomework = async () => {
    if (!user || !newHomework.subject || !newHomework.description) return;
    
    await fetch(`${JOURNAL_URL}?user_id=${user.id}&type=homework`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHomework)
    });

    setNewHomework({
      subject: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0]
    });
    loadHomework();
    toast({ title: 'Домашнее задание добавлено' });
  };

  const addGrade = async () => {
    if (!user || !newGrade.subject) return;
    
    await fetch(`${JOURNAL_URL}?user_id=${user.id}&type=grades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGrade)
    });

    setNewGrade({
      subject: '',
      grade: 5,
      grade_date: new Date().toISOString().split('T')[0],
      description: ''
    });
    loadGrades();
    toast({ title: 'Оценка добавлена' });
  };

  const toggleHomework = async (id: number, completed: boolean) => {
    if (!user) return;
    
    await fetch(`${JOURNAL_URL}?user_id=${user.id}&type=homework`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed })
    });

    loadHomework();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({ title: 'Выход выполнен' });
  };

  const getAverageGrade = () => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, g) => acc + g.grade, 0);
    return (sum / grades.length).toFixed(2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Icon name="BookOpen" size={48} className="text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Электронный Журнал Веб</CardTitle>
            <CardDescription className="text-base">
              {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">ФИО</Label>
                  <Input
                    id="fullName"
                    placeholder="Иванов Иван Иванович"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm"
              >
                {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role === 'teacher') {
    return <TeacherDashboard user={user} onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Icon name="BookOpen" size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Электронный Журнал Веб</h1>
              <p className="text-sm text-muted-foreground">{user.full_name}</p>
            </div>
          </div>
          <Button onClick={logout} variant="outline" size="sm">
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Icon name="Calendar" size={20} className="text-primary" />
                <CardTitle className="text-lg">Расписание</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{schedule.length}</div>
              <p className="text-sm text-muted-foreground mt-1">уроков в неделю</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Icon name="BookMarked" size={20} className="text-accent" />
                <CardTitle className="text-lg">Домашние задания</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                {homework.filter(h => !h.completed).length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">активных заданий</p>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Icon name="Award" size={20} className="text-primary" />
                <CardTitle className="text-lg">Средний балл</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{getAverageGrade()}</div>
              <p className="text-sm text-muted-foreground mt-1">из {grades.length} оценок</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="schedule" className="flex items-center gap-2 py-3">
              <Icon name="Calendar" size={18} />
              <span className="hidden sm:inline">Расписание</span>
            </TabsTrigger>
            <TabsTrigger value="homework" className="flex items-center gap-2 py-3">
              <Icon name="BookMarked" size={18} />
              <span className="hidden sm:inline">Домашние задания</span>
            </TabsTrigger>
            <TabsTrigger value="grades" className="flex items-center gap-2 py-3">
              <Icon name="Award" size={18} />
              <span className="hidden sm:inline">Оценки</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 py-3">
              <Icon name="User" size={18} />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Plus" size={20} />
                  Добавить урок
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>День недели</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={newSchedule.day_of_week}
                      onChange={(e) => setNewSchedule({ ...newSchedule, day_of_week: parseInt(e.target.value) })}
                    >
                      {dayNames.map((day, idx) => (
                        <option key={idx} value={idx + 1}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Время</Label>
                    <Input
                      type="time"
                      value={newSchedule.time_slot}
                      onChange={(e) => setNewSchedule({ ...newSchedule, time_slot: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Предмет</Label>
                    <Input
                      placeholder="Математика"
                      value={newSchedule.subject}
                      onChange={(e) => setNewSchedule({ ...newSchedule, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Преподаватель</Label>
                    <Input
                      placeholder="Иванова А.П."
                      value={newSchedule.teacher}
                      onChange={(e) => setNewSchedule({ ...newSchedule, teacher: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Кабинет</Label>
                    <Input
                      placeholder="201"
                      value={newSchedule.classroom}
                      onChange={(e) => setNewSchedule({ ...newSchedule, classroom: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={addSchedule} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить урок
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {dayNames.map((day, dayIdx) => {
                const daySchedule = schedule.filter(s => s.day_of_week === dayIdx + 1);
                if (daySchedule.length === 0) return null;

                return (
                  <Card key={dayIdx} className="shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-primary">{day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {daySchedule.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border"
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/10 px-3 py-1 rounded-md">
                              <span className="text-sm font-semibold text-primary">{item.time_slot}</span>
                            </div>
                            <div>
                              <div className="font-semibold">{item.subject}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.teacher && <span>{item.teacher}</span>}
                                {item.classroom && <span> • Каб. {item.classroom}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="homework" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Plus" size={20} />
                  Добавить задание
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <Button onClick={addHomework} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить задание
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {homework.map((item) => (
                <Card key={item.id} className={`shadow-md ${item.completed ? 'opacity-60' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) => toggleHomework(item.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-semibold text-lg mb-1">{item.subject}</div>
                            <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {item.description}
                            </p>
                          </div>
                          <Badge variant={item.completed ? 'secondary' : 'default'}>
                            {new Date(item.due_date).toLocaleDateString('ru-RU')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="grades" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Plus" size={20} />
                  Добавить оценку
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label>Примечание</Label>
                    <Input
                      placeholder="Контрольная работа"
                      value={newGrade.description}
                      onChange={(e) => setNewGrade({ ...newGrade, description: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={addGrade} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить оценку
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {grades.map((item) => (
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
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {new Date(item.grade_date).toLocaleDateString('ru-RU')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="User" size={20} />
                  Информация о пользователе
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-primary/10 p-6 rounded-full">
                    <Icon name="User" size={48} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{user.full_name}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <Badge className="mt-2">{user.role}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">ФИО</Label>
                    <p className="font-medium">{user.full_name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Роль</Label>
                    <p className="font-medium capitalize">{user.role}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">ID пользователя</Label>
                    <p className="font-medium">{user.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="BarChart" size={20} />
                  Статистика
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <div className="text-3xl font-bold text-primary">{schedule.length}</div>
                    <p className="text-sm text-muted-foreground mt-1">Уроков в неделю</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <div className="text-3xl font-bold text-accent">{homework.length}</div>
                    <p className="text-sm text-muted-foreground mt-1">Домашних заданий</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <div className="text-3xl font-bold text-primary">{grades.length}</div>
                    <p className="text-sm text-muted-foreground mt-1">Оценок получено</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;