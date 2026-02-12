import { Metadata } from "next";
import { 
    HelpCircle, 
    Book, 
    Video, 
    MessageSquare, 
    Search, 
    FileText, 
    PlayCircle, 
    ChevronRight,
    Users, 
    DollarSign, 
    BarChart3, 
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Help Center | MyOptimise",
  description: "Support, documentation, and training resources.",
};

export default async function HelpPage() {
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-6 md:p-10 space-y-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Help Center
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Guides, resources, and support for your team.
          </p>
        </div>
        <div className="flex items-center gap-4">
             <Button className="h-14 rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                <MessageSquare className="mr-2 h-5 w-5" />
                Contact Support
             </Button>
        </div>
      </div>

      {/* Search Hero */}
      <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 p-10 md:p-16 text-center text-white shadow-2xl shadow-blue-900/20">
         <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">How can we help you today?</h2>
            <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                <Input 
                    className="h-16 pl-16 pr-6 rounded-[2rem] bg-white/10 border-white/20 text-white placeholder:text-white/60 text-lg font-medium focus-visible:ring-white/30 backdrop-blur-md transition-all hover:bg-white/20" 
                    placeholder="Search for articles, guides, or troubleshooting..." 
                />
            </div>
         </div>
         {/* Decorative Circles */}
         <div className="absolute top-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
         <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="guides" className="space-y-8">
        <TabsList className="h-16 p-1 bg-white dark:bg-slate-900/50 rounded-full border border-slate-200 dark:border-slate-800 inline-flex shadow-sm w-full md:w-auto overflow-x-auto justify-start md:justify-center">
            <TabsTrigger value="guides" className="h-full rounded-full px-8 text-base font-bold data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all">
                <Book className="mr-2 h-5 w-5" /> Guides & Docs
            </TabsTrigger>
            <TabsTrigger value="recordings" className="h-full rounded-full px-8 text-base font-bold data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all">
                <Video className="mr-2 h-5 w-5" /> Video Courses
            </TabsTrigger>
            <TabsTrigger value="requests" className="h-full rounded-full px-8 text-base font-bold data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all">
                <HelpCircle className="mr-2 h-5 w-5" /> My Requests
            </TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { title: "Getting Started", icon: PlayCircle, count: "5 articles", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                    { title: "Account Management", icon: Users, count: "8 articles", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
                    { title: "Finance & Billing", icon: DollarSign, count: "4 articles", color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
                    { title: "Content Strategy", icon: FileText, count: "12 articles", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
                    { title: "Analytics Reports", icon: BarChart3, count: "6 articles", color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
                    { title: "Security & Permissions", icon: ShieldAlert, count: "3 articles", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800/50" },
                ].map((category, i) => (
                    <div key={i} className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-xl hover:border-blue-500/30 transition-all duration-300">
                        <div className={`h-14 w-14 rounded-2xl ${category.bg} ${category.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            <category.icon className="h-7 w-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{category.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">{category.count}</p>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
                            View Articles <ChevronRight className="ml-1 h-4 w-4" />
                        </div>
                    </div>
                ))}
            </div>
        </TabsContent>

        <TabsContent value="recordings" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[
                    { title: "Platform Overview Tour", duration: "12:45", thumb: "bg-gradient-to-br from-blue-500 to-cyan-400" },
                    { title: "Advanced Analytics Deep Dive", duration: "24:10", thumb: "bg-gradient-to-br from-purple-500 to-pink-400" },
                    { title: "Managing Team Permissions", duration: "08:30", thumb: "bg-gradient-to-br from-orange-500 to-yellow-400" },
                    { title: "Creating Effective Briefs", duration: "15:20", thumb: "bg-gradient-to-br from-green-500 to-emerald-400" },
                ].map((video, i) => (
                    <div key={i} className="group relative aspect-video rounded-[3rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all">
                        <div className={`absolute inset-0 ${video.thumb} opacity-90 group-hover:scale-105 transition-transform duration-700`} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                                <PlayCircle className="h-10 w-10 text-white fill-current" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                            <h3 className="text-2xl font-bold text-white mb-2">{video.title}</h3>
                            <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-md">
                                {video.duration}
                            </Badge>
                        </div>
                    </div>
                ))}
             </div>
        </TabsContent>

        <TabsContent value="requests" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-10 text-center space-y-6">
                <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <MessageSquare className="h-10 w-10" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">No active support requests</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
                        You haven't submitted any help requests yet. If you need assistance, our team is here to help 24/7.
                    </p>
                </div>
                <Button className="h-14 rounded-full px-8 text-lg font-bold">
                    Submit New Request
                </Button>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
