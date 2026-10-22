import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Handshake,
  Instagram,
  MessageCircle,
  Medal,
  Search,
  Sparkles,
  Target,
  Trophy,
  Users,
  Youtube,
} from "lucide-react";

import { getCourses } from "@/api/api";
import { CourseCard } from "@/components/CourseCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, type Course } from "@/lib/store";

import arya from "../assets/img/Testimonials/arya.jpeg";
import nitin from "../assets/img/Testimonials/Nitin.jpeg";
import sakshi from "../assets/img/Testimonials/sakshi.png";
import shlokImg from "../assets/img/Testimonials/shlok.jpeg";
import class_1 from "../assets/img/class/class_1.jpeg";
import class_2 from "../assets/img/class/class_2.jpeg";
import class_3 from "../assets/img/class/class_3.jpeg";
import class_4 from "../assets/img/class/class_4.jpeg";
import founder from "../assets/img/founder.jpg";
import madma from "../assets/img/madam.jpg";
import priyal from "../assets/img/priyal.png";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Dange Academy - Learn. Grow. Excel." },
      {
        name: "description",
        content:
          "Dange Academy offers expert-led online coaching for science, engineering, diploma, and programming students.",
      },
    ],
  }),
});

function mapRemoteCourse(course: any): Course {
  const chapters = Array.isArray(course.chapters)
    ? course.chapters.map((chapter: any) => ({
        id: String(chapter.id),
        title: chapter.title || chapter.chapterName || "Untitled chapter",
        subtopics: (Array.isArray(chapter.subtopics)
          ? chapter.subtopics
          : chapter.subTopics || []
        ).map((subtopic: any) => ({
          id: String(subtopic.id),
          title: subtopic.title || subtopic.topicName || "Untitled lesson",
          videoUrl:
            subtopic.videoUrl || subtopic.videoUid || course.introVideoUid || "",
          duration: subtopic.duration ?? subtopic.durationInSeconds ?? 0,
        })),
      }))
    : [];

  return {
    id: String(course.id),
    name: course.courseName || course.name || "Untitled course",
    description: course.description || "",
    fees: course.price ?? 0,
    demoVideoUrl: course.introVideoUid || course.demoVideoUrl || "",
    courseThumbnailUrl: course.courseThumbnailUrl,
    category: course.category || "Uncategorized",
    duration: course.courseValidity ? `${course.courseValidity} months` : "3 months",
    chapters,
    enrollmentCount: course.enrolledCount ?? 0,
    originalPrice: course.originalPrice ?? "",
    mentorId: course.mentorId ?? 0,
    enrolledCount: course.enrolledCount ?? 0,
    courseValidity: course.courseValidity ?? 3,
  };
}

const sliderStyle = `
  @keyframes slideTestimonials {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .testimonial-track,
  .gallery-track {
    display: flex;
    width: max-content;
    animation: slideTestimonials 38s linear infinite;
  }
  .gallery-track {
    animation-duration: 50s;
  }
  .testimonial-track:hover,
  .gallery-track:hover {
    animation-play-state: paused;
  }
`;

const testimonials = [
  {
    name: "Shlok Ewarkar",
    role: "Class 12 Student",
    text: "The coaching at Dange's Academy helped me understand difficult topics clearly. My exam confidence improved dramatically.",
    img: shlokImg,
  },
  {
    name: "Sakshi Pardeshi",
    role: "Engineering Aspirant",
    text: "The notes and PDFs are excellent for revision. I could prepare quickly and perform much better in tests.",
    img: sakshi,
  },
  {
    name: "Arya Baviskar",
    role: "Class 11 Student",
    text: "Live videos made studying flexible and easy. I could revise at my pace and clear doubts whenever needed.",
    img: arya,
  },
  {
    name: "Soham Bairagi",
    role: "Class 12",
    text: "The mentors explained every problem step-by-step, and the mock tests helped me improve my speed and accuracy.",
    img: nitin,
  },
];

const classroomImages = [
  { id: 1, url: class_1, alt: "Focused classroom session" },
  { id: 2, url: class_2, alt: "Interactive batch learning" },
  { id: 3, url: class_3, alt: "Mentor-led doubt solving" },
  { id: 4, url: class_4, alt: "Academy learning environment" },
];

const faculty = [
  {
    name: "Prof. Sushil Dange",
    role: "Senior Maths & Physics Mentor",
    desc: "12+ years of coaching experience in Maths and Science for board and competitive exams.",
    img: founder,
  },
  {
    name: "Ms. Yogita Dange",
    role: "Biology & Counselling Expert",
    desc: "Concept-based teaching with clear examples, revision plans, and exam-ready techniques.",
    img: madma,
  },
  {
    name: "Ms. Priyal Dange",
    role: "Engineering Mechanics Expert",
    desc: "Guides diploma and engineering students through core subjects, projects, and competitive exam prep.",
    img: priyal,
  },
];

const aboutStats = [
  { icon: Users, value: "25,000+", label: "Students Mentored" },
  { icon: Medal, value: "99.2%", label: "Board Pass Rate" },
  { icon: GraduationCap, value: "1,450+", label: "Rank Holders (JEE/NEET/CET)" },
  { icon: Sparkles, value: "4.9 / 5", label: "Avg Rating from Students" },
];

const standoutItems = [
  {
    title: "Structured Study Framework",
    text: "Step-by-step topic breakdown designed according to latest board syllabus and entrance weightage.",
  },
  {
    title: "24/7 Doubt Resolution",
    text: "Dedicated mentor WhatsApp channels and live doubts desk so no concept is left unmastered.",
  },
  {
    title: "Proven Results & Toppers",
    text: "Consistent top scores and state-wide merit list rankers year after year.",
  },
];

function formatCategory(category: string) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function Home() {
  const { courses: storeCourses } = useStore();
  const [remoteCourses, setRemoteCourses] = useState<Course[] | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  useEffect(() => {
    getCourses()
      .then((data) => {
        const mapped = (Array.isArray(data) ? data : []).map(mapRemoteCourse);
        setRemoteCourses(mapped);
        setCoursesError(null);
      })
      .catch((error) => {
        console.error("Failed to load courses", error);
        setCoursesError("Courses could not be loaded right now.");
      })
      .finally(() => setLoadingCourses(false));
  }, []);

  const courses = remoteCourses === null ? storeCourses : remoteCourses;
  const filtered = useMemo(
    () =>
      courses.filter(
        (course) =>
          (cat === "All" || course.category === cat) &&
          (q === "" ||
            course.name.toLowerCase().includes(q.toLowerCase()) ||
            course.description.toLowerCase().includes(q.toLowerCase())),
      ),
    [courses, q, cat],
  );

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(courses.map((course) => course.category))).sort()],
    [courses],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style>{sliderStyle}</style>
      <SiteHeader />

      <main>
        <section className="relative flex min-h-[calc(100svh-104px)] items-center overflow-hidden bg-[radial-gradient(circle_at_70%_40%,rgba(28,188,161,0.16),transparent_30%),linear-gradient(90deg,var(--background)_0%,rgba(32,197,177,0.05)_55%,rgba(32,197,177,0.08)_100%)] px-4 py-8 sm:px-6 lg:py-10">
          <div className="mx-auto grid w-full max-w-[1840px] items-center gap-10 lg:grid-cols-[1fr_0.82fr]">
            <div className="max-w-[820px]">
              <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#78eadc] bg-card/85 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-[0_20px_60px_rgba(20,184,166,0.10)] sm:text-base">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#20c5b1]">
                  <span className="h-3 w-3 rounded-full bg-white" />
                </span>
                Get up to <span className="text-[#00a990]">40% off</span> on first enroll
              </div>

              <h1 className="max-w-[820px] text-4xl font-black leading-[1.05] tracking-normal text-foreground sm:text-5xl lg:text-6xl">
                Learning <span className="text-[#22bfa8]">Today,</span>
                <br />
                Leading <span className="text-[#22bfa8]">Tomorrow.</span>
              </h1>

              <p className="mt-7 max-w-[660px] text-xl leading-relaxed text-muted-foreground lg:text-[23px]">
                Learn essential career and academic skills with our expert-led courses
                designed for your ultimate academic success.
              </p>

              <div className="mt-8 flex flex-wrap gap-7 text-base font-bold text-foreground/85 lg:text-lg">
                {["Flexible", "Learning Path", "Community"].map((item) => (
                  <div key={item} className="flex items-center gap-3 font-semibold">
                    <CheckCircle2 className="h-5 w-5 text-[#16bda8] lg:h-6 lg:w-6" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-5">
                <Button
                  asChild
                  className="h-[60px] rounded-2xl bg-black px-8 text-lg font-black text-white shadow-[0_18px_36px_rgba(0,0,0,0.20)] hover:bg-black/90 lg:h-[68px] lg:px-10 lg:text-xl"
                >
                  <Link to="/register">Join For Free</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-[60px] rounded-2xl border-[#72eadf] bg-card/80 px-8 text-lg font-black text-[#17bca5] shadow-none hover:bg-accent lg:h-[68px] lg:px-10 lg:text-xl"
                >
                  <a href="#courses">Explore Courses</a>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px] lg:mr-8">
              <div className="absolute inset-[-50px] rounded-full bg-[#20c5b1]/18 blur-3xl" />
              <div className="relative rotate-[2deg] overflow-hidden rounded-[26px] border-[6px] border-border bg-card shadow-[0_30px_90px_rgba(15,23,42,0.20)]">
                <iframe
                  title="Dange Academy location"
                  className="h-[300px] w-full border-0 md:h-[350px] lg:h-[395px]"
                  src="https://www.google.com/maps?q=Dange%27s+Academy,+Near+Baliram+Patil+School,+In+front+of+Saptapadi+Mangal+Karyalaya,+N-8+CIDCO,+Chh.+Sambhajinagar&output=embed"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="courses" className="mx-auto max-w-[1620px] px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-black leading-tight tracking-normal text-foreground sm:text-4xl">
              Top-Selling Programs,{" "}
              <span className="text-[#22bfa8]">Loved By Engineers & Scholars!</span>
            </h2>
            <p className="mx-auto mt-5 max-w-4xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Master Class 11th, 12th, Polytechnic Diploma, and Engineering Degree
              modules with high-scoring pedagogy.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start lg:pl-[10%]">
              {categories.map((category) => {
                const active = cat === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCat(category)}
                    className={`h-11 rounded-full px-6 text-sm font-black transition-all ${
                      active
                        ? "bg-[#20c5b1] text-[#071126] shadow-[0_12px_28px_rgba(32,197,177,0.22)]"
                        : "bg-muted text-foreground hover:bg-[#e9fbf8] dark:hover:bg-[#0f2b2d]"
                    }`}
                  >
                    {category === "All" ? "All Programs" : formatCategory(category)}
                  </button>
                );
              })}
            </div>

            <div className="relative mx-auto w-full max-w-[360px] lg:mr-[8%]">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a96a8]" />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search math, mechanics, DSA..."
                className="h-12 rounded-full border-border bg-muted pl-[52px] text-base font-medium text-foreground shadow-[inset_0_2px_8px_rgba(15,23,42,0.05)]"
              />
            </div>
          </div>

          {loadingCourses ? (
            <div className="py-20 text-center text-lg font-semibold text-muted-foreground">
              Loading courses...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-lg font-semibold text-muted-foreground">
              {coursesError || "No courses match your search."}
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>

        <section id="about" className="bg-background px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-[1520px]">
            <div className="mx-auto max-w-5xl text-center">
              <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#72eadf] bg-card px-5 py-2 text-lg font-black text-[#16bda8]">
                <GraduationCap className="h-5 w-5" />
                Definite Success Academy
              </div>
              <h2 className="text-3xl font-black leading-[1.12] tracking-normal text-foreground sm:text-5xl">
                Nurturing Excellence,
                <br />
                <span className="text-[#22bfa8]">Inspiring Bright Futures.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-4xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Founded with a passion to deliver top-tier education, Dange's
                Academy has become Maharashtra's hallmark coaching institute for
                state boards, CBSE, JEE, NEET, and foundation courses.
              </p>
            </div>

            <div className="mt-20 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
              {aboutStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[28px] border border-border bg-card px-8 py-10 text-center shadow-[0_22px_45px_rgba(15,23,42,0.12)]"
                >
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#eafffa] text-[#16bda8]">
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <div className="mt-7 text-3xl font-black tracking-normal text-foreground">
                    {stat.value}
                  </div>
                  <div className="mt-3 text-lg font-bold text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-24 grid gap-10 lg:grid-cols-2">
              <div className="rounded-[28px] bg-gradient-to-br from-[#1db8aa] to-[#1599bb] p-10 text-white shadow-[0_28px_70px_rgba(16,185,169,0.22)] sm:p-14">
                <Target className="h-12 w-12 text-white/75" />
                <h3 className="mt-6 text-2xl font-black tracking-normal">
                  Our Vision
                </h3>
                <p className="mt-5 text-sm leading-relaxed text-white sm:text-base">
                  To democratize quality education and competitive exam coaching,
                  empowering every student with self-belief, deep conceptual
                  clarity, and the skills needed to lead tomorrow.
                </p>
              </div>

              <div className="rounded-[28px] bg-card p-10 shadow-[0_28px_70px_rgba(15,23,42,0.12)] sm:p-14">
                <Handshake className="h-12 w-12 text-[#16bda8]" />
                <h3 className="mt-6 text-2xl font-black tracking-normal text-foreground">
                  Our Mission
                </h3>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  To provide affordable, personalized, and technology-driven
                  coaching through interactive video classrooms, comprehensive
                  chapter notes, and continuous 1-on-1 mentorship.
                </p>
              </div>
            </div>

            <div className="mt-24 rounded-[28px] bg-card px-8 py-16 shadow-[0_24px_58px_rgba(15,23,42,0.12)] sm:px-14">
              <div className="text-center">
                <h3 className="text-3xl font-black tracking-normal text-foreground">
                  Why Dange's Academy Stands Apart
                </h3>
                <p className="mt-5 text-lg text-muted-foreground">
                  Our pedagogical philosophy is built on discipline, clarity, and
                  continuous mentor evaluation.
                </p>
              </div>

              <div className="mt-14 grid gap-7 lg:grid-cols-3">
                {standoutItems.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border bg-muted/60 p-8"
                  >
                    <CheckCircle2 className="h-8 w-8 text-[#16bda8]" />
                    <h4 className="mt-5 text-xl font-black tracking-normal text-foreground">
                      {item.title}
                    </h4>
                    <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-24 text-center">
              <h3 className="text-3xl font-black tracking-normal text-foreground sm:text-4xl">
                Meet Our Eminent Faculty
              </h3>
              <p className="mx-auto mt-5 max-w-3xl text-xl text-muted-foreground">
                Seasoned subject experts with decades of classroom teaching and
                exam mastery.
              </p>
            </div>

            <div className="mt-12 grid gap-7 md:grid-cols-3">
              {faculty.map((member) => (
                <div
                  key={member.name}
                  className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_22px_45px_rgba(15,23,42,0.10)]"
                >
                  <img
                    src={member.img}
                    alt={member.name}
                    className="h-[296px] w-full object-cover"
                  />
                  <div className="p-7 text-left">
                    <div className="text-2xl font-black tracking-normal text-foreground">
                      {member.name}
                    </div>
                    <div className="mt-2 font-bold text-[#16bda8]">
                      {member.role}
                    </div>
                    <p className="mt-4 leading-relaxed text-muted-foreground">
                      {member.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-muted/30 py-20" id="testimonials">
          <div className="mb-12 px-4 text-center">
            <h2 className="text-3xl font-black tracking-normal text-foreground md:text-4xl">
              What Our Students Say
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Feedback from learners who improved grades, gained confidence, and
              mastered tough subjects.
            </p>
          </div>

          <div className="testimonial-track gap-6 px-4">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${index}`}
                className="flex w-[330px] shrink-0 flex-col gap-5 rounded-[28px] bg-card p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:w-[390px]"
              >
                <Trophy className="h-7 w-7 text-[#16bda8]" />
                <p className="leading-relaxed text-muted-foreground">
                  "{testimonial.text}"
                </p>
                <div className="mt-auto flex items-center gap-4">
                  <img
                    src={testimonial.img}
                    alt={testimonial.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-black text-foreground">
                      {testimonial.name}
                    </h4>
                    <span className="text-sm font-medium text-muted-foreground">
                      {testimonial.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden border-t border-border bg-background py-20">
          <div className="mx-auto mb-12 max-w-[1520px] px-4 sm:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.18em] text-[#16bda8]">
                  Campus Tour
                </div>
                <h2 className="mt-3 text-3xl font-black tracking-normal text-foreground md:text-4xl">
                  Our Learning Environment
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Take a look inside our focused classrooms designed for clear
                learning, confident practice, and mentor-led progress.
              </p>
            </div>
          </div>

          <div className="gallery-track gap-6 px-4">
            {[...classroomImages, ...classroomImages].map((image, index) => (
              <div
                key={`${image.id}-${index}`}
                className="group relative h-[250px] w-[320px] shrink-0 overflow-hidden rounded-[28px] shadow-[0_22px_55px_rgba(15,23,42,0.14)] md:h-[330px] md:w-[470px]"
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-5 left-5 rounded-full bg-card/90 px-4 py-2 text-sm font-black text-foreground">
                  {image.alt}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="fixed bottom-7 right-7 z-50 hidden sm:block">
          <a
            href="https://wa.me/919767108109"
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
            className="relative grid h-[76px] w-[76px] place-items-center rounded-full bg-[#0fac9b] text-white shadow-[0_18px_45px_rgba(15,172,155,0.35)]"
          >
            <MessageCircle className="h-10 w-10" />
            <span className="absolute right-1 top-0 h-5 w-5 rounded-full border-2 border-white bg-[#f2c811]" />
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
