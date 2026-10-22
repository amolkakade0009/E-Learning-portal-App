import { log } from "console";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type SubTopic = { id: string; title: string; videoUrl: string; duration: number };
export type Chapter = { id: string; title: string; subtopics: SubTopic[] };
export type Course = {
  id: string;
  name: string;
  description: string;
  fees: number;
  demoVideoUrl: string;
  category: string;
  duration: string; // "1 year" | "2 years"
  chapters: Chapter[];
  enrollmentCount: number;
  originalPrice: string,
  mentorId: number,
  courseThumbnailUrl: string,
  courseValidity: number,
  enrolledCount: number,
};

export type User = {
  id: string;
  sessionId?: string;
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
  role: "student" | "admin";
};

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  mobileNumber?: string;
  sessionId?: string;
};
export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  expiresAt: string;
  subscription: string;
  progress: Record<string, number>; // subtopicId -> seconds watched
  lastSubtopicId?: string;
};

export type Payment = {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseName: string;
  amount: number;
  status: "success" | "pending" | "failed";
  transactionId: string;
  date: string;
};

type CartItem = { courseId: string; subscription: string };

type Store = {
  users: User[];
  courses: Course[];
  enrollments: Enrollment[];
  payments: Payment[];
  currentUser: User | null;
  cart: CartItem[];
  hydrated: boolean;
  login: (email: string, password: string) => User | null;
  register: (data: Omit<User, "id" | "role">) => User;
  setAuthenticatedUser: (user: AuthenticatedUser) => void;
  logout: () => void;
  addToCart: (courseId: string, subscription: string) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  checkout: () => Payment[];
  completeCoursePurchase: (courseId: string, transactionId: string, subscription?: string) => void;
  addCourse: (c: Omit<Course, "id" | "enrollmentCount" | "chapters">) => Course;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  updateProgress: (courseId: string, subtopicId: string, seconds: number) => void;
};

const StoreContext = createContext<Store | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();



const LS_KEY = "dange_academy_v1";

function loadState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(state: any) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setUsers(saved.users|| []);
      setCourses(saved.courses || []);
      setEnrollments(saved.enrollments || []);
      setPayments(saved.payments || []);
      setCurrentUser(saved.currentUser || null);
      setCart(saved.cart || []);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({ users, courses, enrollments, payments, currentUser, cart });
  }, [users, courses, enrollments, payments, currentUser, cart, hydrated]);

  const store: Store = {
    users, courses, enrollments, payments, currentUser, cart, hydrated,
    login: (email, password) => {
      const u = users.find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
      if (u) setCurrentUser(u);
      return u || null;
    },
    register: (data) => {
      const u: User = { ...data, id: uid(), role: "student" };
      setUsers(prev => [...prev, u]);
      setCurrentUser(u);
      return u;
    },
      setAuthenticatedUser: (user) => {
        console.log("Setting authenticated user:", user);
      setCurrentUser({ 
        id: user.id,
        sessionId: user.sessionId ?? "",
        name: user.name,
        email: user.email,
        role: user.role,
        mobileNumber: user.mobileNumber ??"",
        password: "",
      });
    },
    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("dange_academy_auth_token");
        localStorage.removeItem("dange_academy_session_id");
      }
      setCurrentUser(null);
    },
    addToCart: (courseId, subscription) => {
      setCart(prev => prev.some(i => i.courseId === courseId) ? prev : [...prev, { courseId, subscription }]);
    },
    removeFromCart: (courseId) => setCart(prev => prev.filter(i => i.courseId !== courseId)),
    clearCart: () => setCart([]),
    checkout: () => {
      if (!currentUser) return [];
      const newPayments: Payment[] = [];
      const newEnrollments: Enrollment[] = [];
      cart.forEach(item => {
        const course = courses.find(c => c.id === item.courseId);
        if (!course) return;
        const years = parseInt(item.subscription) || 1;
        const exp = new Date();
        exp.setFullYear(exp.getFullYear() + years);
        newPayments.push({
          id: uid(), userId: currentUser.id, userName: currentUser.name,
          courseId: course.id, courseName: course.name,
          amount: course.fees, status: "success",
          transactionId: "TXN" + uid().toUpperCase(), date: now(),
        });
        newEnrollments.push({
          id: uid(), userId: currentUser.id, courseId: course.id,
          enrolledAt: now(), expiresAt: exp.toISOString(),
          subscription: item.subscription, progress: {},
        });
      });
      setPayments(prev => [...newPayments, ...prev]);
      setEnrollments(prev => [...prev, ...newEnrollments]);
      setCourses(prev => prev.map(c => cart.some(i => i.courseId === c.id) ? { ...c, enrollmentCount: c.enrollmentCount + 1 } : c));
      setCart([]);
      return newPayments;
    },
    completeCoursePurchase: (courseId, transactionId, subscription = "1 year") => {
      if (!currentUser) return;
      const course = courses.find(c => c.id === courseId);
      if (!course) return;
      const alreadyEnrolled = enrollments.some(e => e.userId === currentUser.id && e.courseId === course.id);

      const years = parseInt(subscription) || 1;
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + years);

      setPayments(prev => prev.some(p => p.transactionId === transactionId) ? prev : [{
        id: uid(),
        userId: currentUser.id,
        userName: currentUser.name,
        courseId: course.id,
        courseName: course.name,
        amount: course.fees,
        status: "success",
        transactionId,
        date: now(),
      }, ...prev]);

      setEnrollments(prev => prev.some(e => e.userId === currentUser.id && e.courseId === course.id) ? prev : [...prev, {
        id: uid(),
        userId: currentUser.id,
        courseId: course.id,
        enrolledAt: now(),
        expiresAt: exp.toISOString(),
        subscription,
        progress: {},
      }]);

      if (!alreadyEnrolled) {
        setCourses(prev => prev.map(c => c.id === course.id ? { ...c, enrollmentCount: c.enrollmentCount + 1 } : c));
      }
      setCart(prev => prev.filter(item => item.courseId !== course.id));
    },
    addCourse: (data) => {
      const c: Course = { ...data, id: uid(), chapters: [], enrollmentCount: 0 };
      setCourses(prev => [...prev, c]);
      return c;
    },
    updateCourse: (id, patch) => setCourses(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c)),
    deleteCourse: (id) => setCourses(prev => prev.filter(c => c.id !== id)),
    updateProgress: (courseId, subtopicId, seconds) => {
      if (!currentUser) return;
      setEnrollments(prev => prev.map(e => {
        if (e.userId !== currentUser.id || e.courseId !== courseId) return e;
        return { ...e, progress: { ...e.progress, [subtopicId]: Math.max(e.progress[subtopicId] || 0, seconds) }, lastSubtopicId: subtopicId };
      }));
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const s = useContext(StoreContext);
  if (!s) throw new Error("useStore must be used within StoreProvider");
  return s;
}

export function courseProgress(course: Course, enrollment: Enrollment | undefined) {
  if (!enrollment) return 0;
  const total = course.chapters.reduce((sum, ch) => sum + ch.subtopics.reduce((s, st) => s + st.duration, 0), 0);
  if (!total) return 0;
  const watched = course.chapters.reduce((sum, ch) => sum + ch.subtopics.reduce((s, st) => s + Math.min(enrollment.progress[st.id] || 0, st.duration), 0), 0);
  return Math.round((watched / total) * 100);
}
