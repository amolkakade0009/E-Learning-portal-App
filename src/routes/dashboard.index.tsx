import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { differenceInDays, format } from "date-fns";
import { Play, BookOpen, Clock } from "lucide-react";

import { useStore } from "@/lib/store";
import { getStudentEnrollCourses , StudentEnrollment} from "@/api/api"; // Update path if required

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/dashboard/")({
  component: MyCourses,
});

interface Enrollment {
  id: number;
  enrolledAt: string;
  expireOn: string;
  course: {
    id: number;
    courseName: string;
    description: string;
    price: number;
    courseValidity: number;
    status: string;
    uploadedDate: string;
    enrolledCount: number;
    thumbnail?: string;
  };
}

function MyCourses() {
  const { currentUser } = useStore();

  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      setLoading(true);

      const response = await getStudentEnrollCourses(currentUser?.id || 0);

      setEnrollments(response);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };
  // Helper for Google Drive Images
const getDirectDriveLink = (url: string) => {
  if (!url || !url.includes("drive.google.com")) return url;
  const fileId = url.match(/\/d\/(.+?)\/(view|edit)?/)?.[1] || url.match(/id=(.+?)(&|$)/)?.[1];
  return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
};

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-border bg-card/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.20em] text-[#20c5b1]">
              Welcome back
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Hi, {currentUser.name.split(" ")[0]} 👋
            </h1>

            <p className="mt-2 text-base text-muted-foreground">
              Continue learning where you left off.
            </p>
          </div>

          <Link to="/" className="inline-flex">
            <Button className="rounded-full bg-[#20c5b1] px-5 py-2.5 text-sm font-black text-[#071126] shadow-[0_14px_28px_rgba(32,197,177,0.2)] hover:bg-[#1db7a4]">
              Browse courses
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 rounded-[28px] border border-border bg-card p-10 text-center text-muted-foreground shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
          Loading your courses...
        </div>
      ) : enrollments.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-border bg-card p-12 text-center shadow-[0_20px_60px_rgba(15,23,42,0.04)]">
          <BookOpen className="mx-auto h-12 w-12 text-[#20c5b1]" />

          <h2 className="mt-4 text-2xl font-black text-foreground">
            No courses yet
          </h2>

          <p className="mt-2 text-muted-foreground">
            Explore our catalog and enroll in your first course.
          </p>

          <Link to="/">
            <Button className="mt-6 rounded-full bg-[#20c5b1] px-6 py-2.5 font-black text-[#071126] hover:bg-[#1db7a4]">
              Browse Courses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            const daysLeft = differenceInDays(new Date(enrollment.expireOn), new Date());

            return (
              <div
                key={enrollment.id}
                className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_20px_60px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(20,184,166,0.10)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={
                      getDirectDriveLink(course.courseThumbnailUrl) || "https://placehold.co/800x400?text=Course"
                    }
                    alt={course.courseName}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#071126]/80 via-[#071126]/15 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-black leading-snug line-clamp-1">
                      {course.courseName}
                    </h3>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold">{enrollment.progressPercentage}% complete</span>

                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3 text-[#20c5b1]" />
                      {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                    </span>
                  </div>

                  <Progress value={enrollment.progressPercentage} className="h-2 bg-muted" />

                  <div className="mt-5 flex items-center gap-2">
                    <Link
                      to="/dashboard/course/$courseId"
                      params={{
                        courseId: String(course.id),
                      }}
                      className="flex-1"
                    >
                      <Button className="w-full rounded-full bg-[#20c5b1] font-black text-[#071126] hover:bg-[#1db7a4]">
                        <Play className="mr-2 h-4 w-4" />
                        {enrollment.progressPercentage > 0 ? "Continue" : "Start"}
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    <div>
                      Enrolled {format(new Date(enrollment.enrolledAt), "MMM d, yyyy")}
                    </div>

                    <div>
                      Valid for {course.courseValidity} month
                      {course.courseValidity > 1 ? "s" : ""}
                    </div>

                    <div>Price: ₹{course.price.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}