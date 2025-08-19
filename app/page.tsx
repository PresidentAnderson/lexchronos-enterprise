import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import {
  Scale,
  Clock,
  FileText,
  Users,
  Calendar,
  BarChart,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Quote,
} from "lucide-react";

const features = [
  {
    icon: Scale,
    title: "Case Management",
    description: "Organize and track all your legal cases with powerful filtering and search capabilities."
  },
  {
    icon: Clock,
    title: "Timeline Visualization",
    description: "Interactive timeline view of case events, deadlines, and milestones for better case understanding."
  },
  {
    icon: FileText,
    title: "Document Management",
    description: "Secure document storage with version control, sharing, and collaboration features."
  },
  {
    icon: Calendar,
    title: "Deadline Tracking",
    description: "Never miss important deadlines with smart notifications and calendar integration."
  },
  {
    icon: Users,
    title: "Client Portal",
    description: "Give clients secure access to their case information and documents."
  },
  {
    icon: BarChart,
    title: "Analytics & Billing",
    description: "Track time, generate invoices, and analyze case performance with detailed reports."
  }
];

const benefits = [
  "Streamline case workflows",
  "Improve client communication",
  "Reduce administrative overhead",
  "Ensure compliance and security",
  "Increase billable hour tracking",
  "Access from anywhere, anytime"
];

const testimonials = [
  {
    quote: "LexChronos has transformed how we manage our cases. The timeline visualization feature alone has saved us countless hours.",
    author: "Sarah Johnson",
    role: "Senior Partner",
    firm: "Johnson & Associates"
  },
  {
    quote: "The client portal has improved our communication dramatically. Clients love having access to their case information 24/7.",
    author: "Michael Chen",
    role: "Managing Attorney",
    firm: "Chen Law Group"
  },
  {
    quote: "We've seen a 40% increase in efficiency since implementing LexChronos. It's been a game-changer for our practice.",
    author: "Emily Rodriguez",
    role: "Partner",
    firm: "Rodriguez & Partners"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">LexChronos</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Legal Case Management
            <span className="text-primary block">Reimagined</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your legal practice with our comprehensive case management platform 
            featuring timeline visualization, document management, and client collaboration tools.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/demo">
                Watch Demo
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            30-day free trial • No credit card required • Setup in minutes
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to manage your legal practice
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to streamline 
              your legal operations and improve client satisfaction.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why law firms choose LexChronos
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of legal professionals who have transformed 
                their practice with our innovative platform.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex items-center gap-4">
                <Button asChild>
                  <Link href="/features">
                    Explore All Features
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/pricing">
                    View Pricing
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Scale className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Interactive Platform Demo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by legal professionals
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our customers are saying about LexChronos
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <Quote className="h-8 w-8 text-muted-foreground mb-4" />
                  
                  <blockquote className="text-lg mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  <div className="border-t pt-4">
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.firm}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="bg-primary text-primary-foreground border-0">
            <CardContent className="text-center py-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to transform your legal practice?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Join thousands of legal professionals who have streamlined their 
                workflow with LexChronos. Start your free trial today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                  <Link href="/register">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8 border-white/20 text-white hover:bg-white/10">
                  <Link href="/contact">
                    Contact Sales
                  </Link>
                </Button>
              </div>
              
              <p className="text-sm opacity-75 mt-4">
                No credit card required • Cancel anytime • 24/7 support
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">LexChronos</span>
              </div>
              <p className="text-muted-foreground">
                Professional legal case management platform designed for modern law firms.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <div className="space-y-2">
                <Link href="/features" className="block text-muted-foreground hover:text-foreground">
                  Features
                </Link>
                <Link href="/pricing" className="block text-muted-foreground hover:text-foreground">
                  Pricing
                </Link>
                <Link href="/security" className="block text-muted-foreground hover:text-foreground">
                  Security
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2">
                <Link href="/about" className="block text-muted-foreground hover:text-foreground">
                  About
                </Link>
                <Link href="/contact" className="block text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
                <Link href="/careers" className="block text-muted-foreground hover:text-foreground">
                  Careers
                </Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2">
                <Link href="/help" className="block text-muted-foreground hover:text-foreground">
                  Help Center
                </Link>
                <Link href="/docs" className="block text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
                <Link href="/status" className="block text-muted-foreground hover:text-foreground">
                  Status
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 LexChronos. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
