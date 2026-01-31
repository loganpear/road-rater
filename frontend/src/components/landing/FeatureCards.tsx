import { Brain, Clock, BarChart3, Shield, Zap, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Brain,
    title: 'AI Analysis',
    description: 'Advanced computer vision detects unsafe driving patterns in real-time.',
    gradient: 'from-primary to-secondary',
  },
  {
    icon: Clock,
    title: 'Detailed Timeline',
    description: 'See exactly when and where each driving event occurred in your footage.',
    gradient: 'from-secondary to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Instant Score',
    description: 'Get a comprehensive 0-100 score with A-F grades in seconds.',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

const eventTypes = [
  { icon: '🚗', label: 'Tailgating', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { icon: '🛑', label: 'Harsh Braking', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { icon: '⚡', label: 'Hard Acceleration', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { icon: '↗️', label: 'Lane Departure', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { icon: '🔄', label: 'Sharp Turns', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
];

export function FeatureCards() {
  return (
    <section className="py-24 bg-background relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            How <span className="text-gradient">DriveScore AI</span> Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload your dashcam footage and let our AI analyze your driving patterns to help you become a safer driver.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <CardContent className="p-8 relative z-10">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Event types */}
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold mb-4">Events We Detect</h3>
          <p className="text-muted-foreground mb-8">
            Our AI identifies these unsafe driving behaviors
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {eventTypes.map((event) => (
            <div
              key={event.label}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${event.color} backdrop-blur-sm`}
            >
              <span className="text-lg">{event.icon}</span>
              <span className="font-medium">{event.label}</span>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6">
            <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
            <div className="font-semibold">Privacy First</div>
            <div className="text-sm text-muted-foreground">Videos processed securely</div>
          </div>
          <div className="p-6">
            <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
            <div className="font-semibold">Fast Processing</div>
            <div className="text-sm text-muted-foreground">Results in seconds</div>
          </div>
          <div className="p-6">
            <Target className="h-8 w-8 text-primary mx-auto mb-3" />
            <div className="font-semibold">Accurate Detection</div>
            <div className="text-sm text-muted-foreground">AI-powered precision</div>
          </div>
          <div className="p-6">
            <BarChart3 className="h-8 w-8 text-primary mx-auto mb-3" />
            <div className="font-semibold">Actionable Insights</div>
            <div className="text-sm text-muted-foreground">Tips to improve</div>
          </div>
        </div>
      </div>
    </section>
  );
}
