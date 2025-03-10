import React, { useEffect, useState } from 'react';
import { getCourses, createCourse } from '../../services/api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Course {
  id: number;
  title: string;
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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseTitle, setNewCourseTitle] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (error) {
      console.error('Błąd pobierania kursów:', error);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCourse(newCourseTitle);
      setNewCourseTitle('');
      fetchCourses(); // Odśwież listę
    } catch (error) {
      console.error('Błąd tworzenia kursu:', error);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Lista kursów</h2>
      <ul>
        {courses.map((course) => (
          <li key={course.id}>{course.title}</li>
        ))}
      </ul>

      <h3>Dodaj nowy kurs</h3>
      <form onSubmit={handleCreateCourse}>
        <input
          type="text"
          placeholder="Nazwa kursu"
          value={newCourseTitle}
          onChange={(e) => setNewCourseTitle(e.target.value)}
          required
        />
        <button type="submit">Dodaj</button>
      </form>
    </div>
  );
}
