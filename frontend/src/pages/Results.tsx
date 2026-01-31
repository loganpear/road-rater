import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { VideoPlayer } from '@/components/results/VideoPlayer';
import { EventTimeline } from '@/components/results/EventTimeline';
import { ScoreGauge } from '@/components/results/ScoreGauge';
import { ScoreBreakdown } from '@/components/results/ScoreBreakdown';
import { getAnalysis } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Download, Upload, ArrowLeft, AlertCircle } from 'lucide-react';

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(0);

  // Get analysis data
  const analysis = id ? getAnalysis(id) : null;

  const handleEventClick = useCallback((timestamp: number) => {
    setCurrentTime(timestamp);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  if (!analysis) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center px-4">
            <div className="p-4 rounded-full bg-destructive/20 w-fit mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Analysis Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The requested analysis could not be found.
            </p>
            <Button onClick={() => navigate('/upload')}>
              <Upload className="mr-2 h-4 w-4" />
              Upload New Video
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Back button and title */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{analysis.videoName}</h1>
                <p className="text-muted-foreground text-sm">
                  Analyzed on {new Date(analysis.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="hidden sm:flex">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
              <Button onClick={() => navigate('/upload')}>
                <Upload className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column - Video and Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <VideoPlayer
                videoUrl={analysis.videoUrl}
                duration={analysis.videoDuration}
                events={analysis.events}
                currentTime={currentTime}
                onTimeUpdate={handleTimeUpdate}
              />
              
              <EventTimeline
                events={analysis.events}
                duration={analysis.videoDuration}
                currentTime={currentTime}
                onEventClick={handleEventClick}
              />
            </div>

            {/* Right column - Score and Breakdown */}
            <div className="space-y-6">
              {/* Score card */}
              <div className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <ScoreGauge score={analysis.score} grade={analysis.grade} size="md" />
                  <p className="text-center text-muted-foreground mt-4 text-sm">
                    {analysis.summary}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <ScoreBreakdown breakdown={analysis.breakdown} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Results;
