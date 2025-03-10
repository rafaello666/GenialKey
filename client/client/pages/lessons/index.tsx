import React, { useEffect, useState } from 'react';
import { getLessons, createLesson } from '../../services/api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Lesson {
  id: number;
  title: string;
  courseId: number;
}

export default function HomePage() {
  return (
    <div style={{ padding: '1rem' }}>
      <h1>Witaj w aplikacji do nauki szybkiego pisania!</h1>
      <p>
        Przejdź do zakładki <a href="/courses">Courses</a>, aby zobaczyć listę
        kursów.
      </p>
    </div>
  );
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseId, setCourseId] = useState<number>(1); // przykładowo
  const [lessonTitle, setLessonTitle] = useState('');

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const data = await getLessons();
      setLessons(data);
    } catch (error) {
      console.error('Błąd pobierania lekcji:', error);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLesson(courseId, lessonTitle);
      setLessonTitle('');
      fetchLessons();
    } catch (error) {
      console.error('Błąd tworzenia lekcji:', error);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Lista lekcji</h2>
      <ul>
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            {lesson.title} (Course ID: {lesson.courseId})
          </li>
        ))}
      </ul>
      <h3>Dodaj nową lekcję</h3>
      <form onSubmit={handleCreateLesson}>
        <input
          type="number"
          placeholder="ID kursu"
          value={courseId}
          onChange={(e) => setCourseId(Number(e.target.value))}
          required
        />
        <input
          type="text"
          placeholder="Tytuł lekcji"
          value={lessonTitle}
          onChange={(e) => setLessonTitle(e.target.value)}
          required
        />
        <button type="submit">Dodaj lekcję</button>
      </form>
    </div>
  );
}
