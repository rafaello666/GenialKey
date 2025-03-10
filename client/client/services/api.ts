import axios, { AxiosInstance } from 'axios';

// W produkcji często warto url ustawić w zmiennych środowiskowych:
// np. process.env.NEXT_PUBLIC_API_URL
// albo w .env.local / .env.production
const baseURL = 'http://localhost:3000'; // Przykładowy adres NestJS

const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Przykładowe funkcje - docelowo możesz je rozdzielić w osobnych plikach:
export const getCourses = async () => {
  const response = await apiClient.get('/courses');
  return response.data;
};

export const createCourse = async (title: string) => {
  const response = await apiClient.post('/courses', { title });
  return response.data;
};

export const getLessons = async () => {
  const response = await apiClient.get('/lessons');
  return response.data;
};

export const createLesson = async (courseId: number, lessonTitle: string) => {
  const response = await apiClient.post('/lessons', {
    courseId,
    title: lessonTitle,
  });
  return response.data;
};

export const submitTypingResult = async (lessonId: number, wpm: number) => {
  const response = await apiClient.post('/typing-results', {
    lessonId,
    wpm,
  });
  return response.data;
};

export default apiClient;
