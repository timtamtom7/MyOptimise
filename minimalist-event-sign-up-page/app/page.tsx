import { SignupForm } from "@/components/signup-form"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { CalendarIcon, ClockIcon, MapPinIcon } from "lucide-react"

const attendees = [
  {
    name: "Esteben Suarez",
    image: "https://pbs.twimg.com/profile_images/1855928924171059200/ilxcUzvo_400x400.jpg",
  },
  {
    name: "Alexis Collado",
    image: "https://pbs.twimg.com/profile_images/1755156767120486400/dXnKJ7fk_400x400.jpg",
  },
  {
    name: "Caroline Ciaramitaro",
    image: "https://pbs.twimg.com/profile_images/1857789494226989062/ASKB9czo_400x400.jpg",
  },
]

export default function Home() {
  return (
    <main className="dark min-h-screen flex items-center justify-center px-6 py-24 bg-background">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-[11px] text-muted-foreground uppercase tracking-widest">Hosted by</span>
          <span className="text-[11px] text-foreground font-medium uppercase tracking-widest">Vercel</span>
        </div>

        <header className="space-y-6 mb-10">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-balance leading-[1.1]">
            Agents, Coffee,
            <br />
            <span className="text-muted-foreground">& Good Conversation</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
            A Saturday morning for curious minds. We'll talk AI agents, ship with v0, and imagine what's next — fueled
            by single-origin pour-overs.
          </p>
        </header>

        <div className="flex flex-wrap gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <CalendarIcon className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">January 18, 2025</p>
              <p className="text-xs text-muted-foreground">Saturday</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <ClockIcon className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">9:00 AM</p>
              <p className="text-xs text-muted-foreground">PHT</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <MapPinIcon className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Yardstick Coffee</p>
              <p className="text-xs text-muted-foreground">BGC, Taguig</p>
            </div>
          </div>
        </div>

        <div className="relative w-full h-36 rounded-lg overflow-hidden border border-border mb-10">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.5670847068973!2d121.04529407593066!3d14.550986778284!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c8edc39b5c5f%3A0x5e7f23e9c9963bc6!2sYardstick%20Coffee!5e0!3m2!1sen!2sph!4v1704067200000!5m2!1sen!2sph"
            width="100%"
            height="100%"
            style={{ border: 0, filter: "grayscale(100%) invert(92%) contrast(90%)" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Yardstick Coffee, BGC"
          />
        </div>

        <div className="mb-10">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Who's attending</p>
          <div className="flex flex-wrap gap-4">
            {attendees.map((attendee) => (
              <div key={attendee.name} className="flex items-center gap-2">
                <Avatar className="size-8 border border-border">
                  <AvatarImage src={attendee.image || "/placeholder.svg"} alt={attendee.name} />
                  <AvatarFallback>{attendee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground">{attendee.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border">
                <span className="text-xs text-muted-foreground">+12</span>
              </div>
              <span className="text-sm text-muted-foreground">others</span>
            </div>
          </div>
        </div>

        <SignupForm />

        <footer className="mt-8 text-center">
          <p className="text-[11px] text-muted-foreground tracking-wide">50 seats only. First come, first served.</p>
        </footer>
      </div>
    </main>
  )
}
