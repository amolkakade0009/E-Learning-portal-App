import axios from "axios";
import * as tus from "tus-js-client";
export type SignUpPayload = {
  name: string;
  email: string;
  mobileNumber: number;
  password: string;
};

export type LoginPayload = Pick<SignUpPayload, "email" | "password"> & {
  otp?: string;
};

export type LoginResponse = {
  role?: string;
  user_id?: string;
  sessionId?: string;
  session_id?: string;
  name?: string;
  email?: string;
  token?: string;
  mobileNumber?: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ForgotPasswordResponse = {
  message: string;
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
};

export type VerifyOtpResponse = {
  message: string;
  resetToken: string;
};

export type ResetPasswordPayload = {
  resetToken: string;
  newPassword: string;
};

export type ResetPasswordResponse = {
  message: string;
};

export type Student = {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  role: string;
};

export type StudentCourse = {
  id: number;
  courseName: string;
  description: string;
  price: number;
  introVideoUid: string;
  courseValidity: number;
  status: string;
  uploadedDate: string;
  updatedDate: string;
  enrolledCount: number;
  chapters: CourseChapter[];
    originalPrice: string,
  mentorId: number,
  courseThumbnailUrl: string,
  category: string,
};

export type CourseChapter = {
  id: number;
  chapterName: string;
  description: string;
  chapterOrder: number;
  subTopics: CourseSubTopic[];
};

export type CourseSubTopic = {
  id: number;
  topicName: string;
  content: string;
  topicOrder: number;
  videoUid: string;
  durationInSeconds: number;
};
export type Mentor = {
  id: number;
  name: string;
  email: string;
  mobileNumber: string;
  profileImageUrl: string;
  bio: string;
  designation: string;
  experienceYears: number;
  qualification: string;
};
export type StudentEnrollCourse = {
  id: number;
  courseName: string;
  description: string;
  price: number;
  courseValidity: number;
  status: string;
  uploadedDate: string;
  enrolledCount: number;
};
export type StudentEnrollment = {
    id: number;
    enrolledAt: string;
    expireOn: string;
    course: StudentCourse;
    courseThumbnailUrl: string;
    progressPercentage: number;
};

export type CreateMentorPayload = Omit<Mentor, "id">;
export type CreateCoursePayload = Pick<StudentCourse, "courseName" | "description" | "price" | "introVideoUid" | "courseValidity" | "status">;
export type CreateChapterPayload = Pick<CourseChapter, "chapterName" | "description" | "chapterOrder">;
export type CreateSubTopicPayload = Pick<CourseSubTopic, "topicName" | "content" | "topicOrder" | "videoUid">;

export type CreatePaymentOrderResponse = {
  orderId?: string;
  razorpayOrderId?: string;
  amount: number;
  currency: string;
  keyId: string;
  courseName: string;
};

export type VerifyPaymentPayload = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  stundetid: string | number;
  courseId: string | number;
  enrolledAt: string;
};

export type VerifyPaymentResponse = {
  status: string;
  message: string;
};

export type StudentQueryPayload = {
  massage: string;
};

type UploadUrlResponse = {
  videoUid?: string;
  uid?: string;
  uploadUrl?: string;
  uploadURL?: string;
  url?: string;
};

const api = axios.create({
  baseURL:  "https://dange-academy.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("dange_academy_auth_token");
  localStorage.removeItem("dange_academy_session_id");
  window.dispatchEvent(new CustomEvent("auth:session-expired"));
}

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  // 1. Define public endpoints that do not need a token
  const publicEndpoints = ["/auth/signup", "/auth/login", "/public/courses", "/auth/forgot-password", "/auth/verify-otp", "/auth/reset-password"];

  // 2. Check if the current request URL matches a public endpoint
  const isPublic = publicEndpoints.some((path) => config.url?.endsWith(path));

  // 3. Only attach the token if the endpoint is NOT public
  if (!isPublic) {
    const token = localStorage.getItem("dange_academy_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      clearAuthSession();
    }
    return Promise.reject(error);
  }
);


export async function signUp(payload: SignUpPayload): Promise<string> {
  const response = await api.post<string>("/auth/signup", payload);
  console.log("SignUp Response:", response.data); // Log the response data
  return response.data || "Account created successfully.";
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", payload);
  return response.data;
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  const response = await api.post<ForgotPasswordResponse>("/auth/forgot-password", payload);
  return response.data;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const response = await api.post<VerifyOtpResponse>("/auth/verify-otp", payload);
  return response.data;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
  const response = await api.post<ResetPasswordResponse>("/auth/reset-password", payload);
  return response.data;
}

export async function getStudents(): Promise<Student[]> {
  const response = await api.get<Student[]>("/student");
  return response.data;
}

/**
 * The backend exposes this under the student path, but administrators are
 * authorized to use it as well. The shared client supplies the JWT.
 */
export async function getStudentCourses(): Promise<StudentCourse[]> {
  const response = await api.get<StudentCourse[]>("/student/courses");
  return response.data;
}

export async function logoutUser(userId: number | string): Promise<any[]> {
  const response = await api.post<any[]>(`/student/logout/${userId}`);
  return response.data;
}

export async function getStudentEnrollCourses(studentId: String | number): Promise<StudentEnrollment[]> {
  const response = await api.get<StudentEnrollment[]>(`/enrollment/student/${studentId}`);
  return response.data;
}


export async function createCourse(payload: CreateCoursePayload): Promise<StudentCourse> {
  const response = await api.post<StudentCourse>("/admin/course/create", payload);
  return response.data;
}

export async function getCourseChapters(courseId: string | number): Promise<CourseChapter[]> {
  const response = await api.get<CourseChapter[]>(`/admin/chapters/course/${courseId}`);
  return response.data;
}

export async function createChapter(courseId: string | number, payload: CreateChapterPayload): Promise<CourseChapter> {
  const response = await api.post<CourseChapter>(`/admin/chapters/course/${courseId}`, payload);
  return response.data;
}

export async function getChapterSubTopics(chapterId: string | number): Promise<CourseSubTopic[]> {
  const response = await api.get<CourseSubTopic[]>(`/admin/subtopics/chapter/${chapterId}`);
  return response.data;
}

export async function createSubTopic(chapterId: string | number, payload: CreateSubTopicPayload): Promise<CourseSubTopic> {
  const response = await api.post<CourseSubTopic>(`/admin/subtopics/chapter/${chapterId}`, payload);
  return response.data;
}

export async function updateSubTopic(id: string | number, payload: CreateSubTopicPayload): Promise<CourseSubTopic> {
  const response = await api.put<CourseSubTopic>(`/admin/subtopics/${id}`, payload);
  return response.data;
}

/** Generates a video UID, uploads the file directly, then returns that UID. */
// Update this function in your api.ts
 // change this import to your actual api instance


const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024 * 1024; // 20 GB
const TUS_CHUNK_SIZE = 50 * 1024 * 1024; // 50 MB
const RETRY_DELAYS = [0, 3000, 5000, 10000, 20000, 30000];

export async function uploadVideo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  // ---------------------------------------------------------
  // 1. Validate file
  // ---------------------------------------------------------
  if (!file) throw new Error("No video file was selected.");
  if (file.size === 0) throw new Error("The selected video file is empty.");
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error(
      `Video is too large. Max allowed: ${MAX_VIDEO_SIZE_BYTES / (1024**3)} GB.`
    );
  }

  // ---------------------------------------------------------
  // 2. Ask Spring Boot for a TUS Initialization URL
  // IMPORTANT: We now send file metadata to the backend
  // ---------------------------------------------------------
  let response;
  try {
    response = await api.post<UploadUrlResponse>(
      "/admin/videos/upload-url",
      {
        fileSize: file.size,
        fileName: file.name,
        contentType: file.type || "video/mp4"
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Cloudflare session failed: ${message}`);
    }
    throw new Error("Unable to create Cloudflare upload session.");
  }

  // ---------------------------------------------------------
  // 3. Resolve backend response fields
  // ---------------------------------------------------------
  const { videoUid, uid, uploadUrl, uploadURL, url } = response.data;
  const resolvedVideoUid = videoUid ?? uid;
  const resolvedUploadUrl = uploadUrl ?? uploadURL ?? url;

  if (!resolvedVideoUid || !resolvedUploadUrl) {
    throw new Error("Invalid response from video upload service.");
  }

  // ---------------------------------------------------------
  // 4. Upload directly to Cloudflare using TUS
  // ---------------------------------------------------------
  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const upload = new tus.Upload(file, {
      // For Cloudflare, we provide the pre-created session URL
      uploadUrl: resolvedUploadUrl, 
      
      
      chunkSize: TUS_CHUNK_SIZE,
      retryDelays: RETRY_DELAYS,
     overridePatchMethod: false, 
      // This is crucial for resumability if the user refreshes
      removeFingerprintOnSuccess: true, 

      onProgress: (bytesUploaded: number, bytesTotal: number) => {
        if (!bytesTotal) return;
        const percent = Math.min(100, Math.round((bytesUploaded / bytesTotal) * 100));
        onProgress?.(percent);
      },

      onError: (error: Error) => {
        if (settled) return;
        settled = true;
        console.error("Cloudflare upload error:", error);
        reject(new Error(`Upload failed: ${error.message}`));
      },

      onSuccess: () => {
        if (settled) return;
        settled = true;
        onProgress?.(100);
        console.log("Upload successful:", resolvedVideoUid);
        resolve(resolvedVideoUid);
      },
    });

    // ---------------------------------------------------------
    // 5. Start / Resume logic
    // ---------------------------------------------------------
    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    }).catch(() => {
        // If searching for previous uploads fails, just start normally
        upload.start();
    });
  });
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") {
      const message = (data as { message?: unknown; error?: unknown }).message
        ?? (data as { error?: unknown }).error;
      if (typeof message === "string" && message.trim()) return message;
    }
    if (!error.response)
      {

        console.log(error);
        return "Unable to reach the server. Please try again shortly.";
      } 
  }
  return fallback;
}

export async function getCourses() {
  const response = await api.get("/public/courses");
  return response.data;
}
export async function updateCourse(courseId: string | number, payload: any): Promise<StudentCourse> {
  const response = await api.put<StudentCourse>(`/admin/course/${courseId}`, payload);
  return response.data;
}
export async function createPaymentOrder(courseId: string | number,userId:String|number): Promise<CreatePaymentOrderResponse> {
  const response = await api.get<CreatePaymentOrderResponse>(`/student/order/create-order/${courseId}/${userId}`);
  return response.data;
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
  const response = await api.post<VerifyPaymentResponse>("/student/order/verify", payload);
  return response.data;
}

export async function getPublicCourse(id: string | number): Promise<any> {
  const response = await axios.get(`https://dange-academy.onrender.com/public/course/${id}`);
  return response.data;
}

// Public endpoint for demo videos (if different from student endpoint)
export async function getPublicPlaybackUrl(uid: string): Promise<string> {
  const response = await axios.get(`https://dange-academy.onrender.com/public/course/${uid}/playback-url`);
  return response.data;
}

export async function getMentors(): Promise<Mentor[]> {
  const response = await api.get<Mentor[]>("/admin/mentors"); // Assuming this endpoint exists for listing
  return response.data;
}

export async function createMentor(payload: CreateMentorPayload): Promise<Mentor> {
  const response = await api.post<Mentor>("/admin/mentors/create", payload);
  return response.data;
}

export async function updateMentor(id: number, payload: CreateMentorPayload): Promise<Mentor> {
  const response = await api.put<Mentor>(`/admin/mentors/${id}`, payload);
  return response.data;
}

export async function deleteMentor(id: number): Promise<void> {
  await api.delete(`/admin/mentors/${id}`);
}
export async function deleteSubTopic(id: number): Promise<void> {
  await api.delete(`/admin/subtopics/${id}`);
}
export async function deleteChapter(id: number): Promise<void> {
  await api.delete(`/admin/chapters/${id}`);
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/admin/course/${id}`);
}
export async function getStudentOrders(userId: string | number): Promise<any[]> {
  const response = await api.get<any[]>(`/student/order/${userId}`);
  return response.data;
}
export async function getAllOrders(): Promise<any[]> {
  const response = await api.get<any[]>("/student/order");
  return response.data;
}

export async function sendStudentQuery(payload: StudentQueryPayload): Promise<string> {
  const response = await api.post<string>("/student/query", payload);
  return response.data;
}