import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LiveSearchDemo } from "@/components/LiveSearchDemo";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle, Star, Users, Zap, Brain, MessageSquare, FileText, Globe, Search, Edit } from "lucide-react";

const EnhancedLanding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState("research");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <h2 className="text-lg font-semibold mb-2">Loading your workspace...</h2>
          <p className="text-muted-foreground">Just a moment...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      id: "research",
      icon: Search,
      title: "AI-Powered Research",
      description: "Instantly gather comprehensive information from across the web using real-time search",
      demo: {
        prompt: "Research the latest trends in sustainable technology",
        response: [
          "🔍 Searching web for sustainable technology trends...",
          "📊 Analyzing 15+ recent sources...",
          "🎯 Key findings: Green hydrogen production up 300%, AI-driven energy optimization, circular economy models...",
          "✅ Research complete! Ready to create content."
        ]
      }
    },
    {
      id: "writing",
      icon: FileText,
      title: "Intelligent Content Creation",
      description: "Generate engaging articles, blogs, and reports with AI assistance based on your research",
      demo: {
        prompt: "Write a compelling blog post about AI in healthcare",
        response: [
          "📝 Drafting article structure...",
          "🤖 Optimizing for readability and SEO...",
          "✨ Adding expert insights and citations...",
          "🎯 Article ready: 'How AI is Revolutionizing Patient Care'"
        ]
      }
    },
    {
      id: "chat",
      icon: MessageSquare,
      title: "Conversational AI Assistant",
      description: "Have natural conversations to refine and improve your content with real-time web access",
      demo: {
        prompt: "Make this article more engaging for millennials",
        response: [
          "💬 Understanding target audience preferences...",
          "🎨 Adding relatable examples and modern references...",
          "📱 Optimizing tone for social media sharing...",
          "✅ Content updated with millennial-friendly language!"
        ]
      }
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Content Marketing Director",
      company: "TechFlow Solutions",
      content: "Mithoo transformed our content creation process. What used to take days now takes hours, and the quality is exceptional. Our engagement rates increased by 340%!",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Startup Founder",
      company: "InnovateTech",
      content: "As a solo founder, I needed to wear many hats. Mithoo became my entire content team - research, writing, and optimization all in one tool.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Digital Marketing Manager",
      company: "Growth Dynamics",
      content: "The AI agent's ability to understand context and create coherent, engaging content is mind-blowing. It's like having a team of expert writers.",
      rating: 5
    }
  ];

  const stats = [
    { value: "10,000+", label: "Articles Created", icon: FileText },
    { value: "50,000+", label: "Happy Users", icon: Users },
    { value: "340%", label: "Engagement Boost", icon: Zap },
    { value: "4.9/5", label: "User Rating", icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xl">🦜</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Mithoo
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('demo')} className="text-sm font-medium hover:text-primary transition-colors">
                Demo
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="text-sm font-medium hover:text-primary transition-colors">
                Testimonials
              </button>
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  Get Started Free
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/20 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            AI-Powered Content Creation
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Create Amazing Content
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              10x Faster
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            From research to publication - experience the power of AI that thinks, plans, and creates alongside you with real-time web access.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 py-6">
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto text-lg px-8 py-6"
              onClick={() => scrollToSection('demo')}
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Experience the Magic</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how Mithoo's AI agent thinks, plans, and creates content in real-time. <br />
              <strong>Try it out yourself!</strong>
            </p>
          </div>
          <LiveSearchDemo />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-secondary/10">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need to Create</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From idea to publication - all the tools you need in one powerful platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "Real-Time Web Research",
                description: "Automatically gathers and synthesizes information from across the web using live search, ensuring your content is always current and comprehensive."
              },
              {
                icon: Edit,
                title: "Smart Content Creation",
                description: "Generate engaging, SEO-optimized content that resonates with your audience while maintaining your unique voice and style."
              },
              {
                icon: MessageSquare,
                title: "Conversational AI Assistant",
                description: "Chat naturally with AI to refine, expand, or adjust your content until it's perfect for your needs with real-time web access."
              }
            ].map((feature, index) => (
              <div key={feature.title} className="bg-card rounded-xl p-8 border hover:shadow-lg transition-all duration-300">
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Creators Worldwide</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied users who have transformed their content creation process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.name} className="bg-card rounded-xl p-8 border">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Content Creation?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of creators who are already using Mithoo to create amazing content faster than ever before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                onClick={() => scrollToSection('demo')}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Live Demo
              </Button>
            </div>
            <p className="text-sm text-white/70 mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Link to="/" className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-lg">🦜</span>
              </div>
              <span className="text-xl font-bold">Mithoo</span>
            </Link>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary">Privacy</Link>
              <Link to="/terms" className="hover:text-primary">Terms</Link>
              <Link to="/support" className="hover:text-primary">Support</Link>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-8">
            © 2024 Mithoo. Built with ❤️ for creators worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedLanding;
