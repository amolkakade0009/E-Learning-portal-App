import {
  Facebook,
  GraduationCap,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-[#071126] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#20c5b1] text-[#071126]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-xl font-semibold">
                  Dange Academy
                </div>
                <div className="text-xs uppercase tracking-widest text-white/60">
                  Definite Success
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              Danges Academy is committed to educational excellence. Empowering
              students with the skills and knowledge they need to succeed in their
              careers and life. We provide a comprehensive learning platform that
              prepares you for the challenges of today's professional world.
            </p>
            <div className="mt-6 flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-[#20c5b1] hover:text-[#071126]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>
                <a
                  href="/#courses"
                  className="transition-colors hover:text-[#20c5b1]"
                >
                  All Courses
                </a>
              </li>
              <li>
                <a
                  href="/#about"
                  className="transition-colors hover:text-[#20c5b1]"
                >
                  About Us
                </a>
              </li>
              <li>
                <Link
                  to="/login"
                  className="transition-colors hover:text-[#20c5b1]"
                >
                  Student Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="transition-colors hover:text-[#20c5b1]"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Contact</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#20c5b1]" />
                Baliram Patil High School, Vinayak Housing Society, Navbharat
                Housing Society, N 8, Cidco, Chhatrapati Sambhajinagar,
                Maharashtra 431003
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#20c5b1]" /> +91 9767108109
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#20c5b1]" /> +91 7666100118
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#20c5b1]" />
                admin@dangesacademy.online
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#20c5b1]" />
                info@dangesacademy.online
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60">
          <div>
            Copyright {new Date().getFullYear()} Dange Academy. All rights
            reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-[#20c5b1]">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-[#20c5b1]">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-[#20c5b1]">
              Refund Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
