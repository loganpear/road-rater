import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { VideoPlayer } from '@/components/results/VideoPlayer';
import { EventTimeline } from '@/components/results/EventTimeline';
import { ScoreGauge } from '@/components/results/ScoreGauge';
import { ScoreBreakdown } from '@/components/results/ScoreBreakdown';
import { fetchAnalysis, getAnalysis } from '@/services/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Download, Loader2, Upload } from 'lucide-react';
import type { AnalysisResult } from '@/types/analysis';

const Results = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use real video metadata for duration (avoids divide-by-zero marker issues)
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const metaVideoRef = useRef<HTMLVideoElement>(null);

  const cached = useMemo(() => (id ? getAnalysis(id) : null), [id]);

  useEffect(() => {
    if (!id) {
      setError('Missing analysis id');
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setError(null);
    setVideoError(null);
    setCurrentTime(0);

    // Prefer cache first for snappy UX
    if (cached) {
      setAnalysis(cached);
      setLoading(false);
      return;
    }

    // If not cached, fetch from backend
    (async () => {
      try {
        setLoading(true);
        const a = await fetchAnalysis(id, { signal: ac.signal });
        setAnalysis(a);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [id, cached]);

  // When analysis changes, reset duration to the best known value, then refine via metadata.
  useEffect(() => {
    setVideoDuration(analysis?.videoDuration ?? 0);
  }, [analysis?.id]);

  const handleEventClick = useCallback((timestamp: number) => {
    setCurrentTime(timestamp);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center px-4">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Loading results…</h1>
            <p className="text-muted-foreground">Fetching your analysis from the server.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center px-4">
            <div className="p-4 rounded-full bg-destructive/20 w-fit mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Analysis Not Found</h1>
            <p className="text-muted-foreground mb-6">{error ?? 'The requested analysis could not be found.'}</p>
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

  const videoUrl = analysis.videoUrl;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Back button and title */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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
              <Button onClick={() => navigate('/upload')}>
                <Upload className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            </div>
          </div>

          {/* Hidden metadata loader */}
          <video
            ref={metaVideoRef}
            src={videoUrl}
            className="hidden"
            preload="metadata"
            onLoadedMetadata={() => {
              const d = metaVideoRef.current?.duration ?? 0;
              if (Number.isFinite(d) && d > 0) setVideoDuration(d);
            }}
            onError={() => setVideoError('Could not load video. The URL may be invalid or blocked.')}
          />

          {/* Main content grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column - Video and Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {videoError ? (
                <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h2 className="font-semibold text-destructive">Video failed to load</h2>
                      <p className="text-sm text-muted-foreground mt-1">{videoError}</p>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" onClick={() => window.location.reload()}>
                          Retry
                        </Button>
                        <Button asChild>
                          <a href={videoUrl} target="_blank" rel="noreferrer">
                            Open video in new tab
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {videoDuration > 0 ? (
                    <VideoPlayer
                      videoUrl={videoUrl}
                      duration={videoDuration}
                      currentTime={currentTime}
                      onTimeUpdate={handleTimeUpdate}
                    />
                  ) : (
                    <div className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                      <p className="font-medium">Loading video…</p>
                      <p className="text-sm text-muted-foreground">Reading metadata so the timeline renders correctly.</p>
                    </div>
                  )}

                  {/*videoDuration > 0 && (
                    <EventTimeline
                      events={analysis.events}
                      duration={videoDuration}
                      currentTime={currentTime}
                      onEventClick={handleEventClick}
                    />
                  )*/}
                </>
              )}
            </div>

            {/* Right column - Score and Breakdown */}
            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <ScoreGauge score={analysis.score} grade={analysis.grade} size="md" />
                  <p className="text-center text-muted-foreground mt-4 text-sm">{analysis.summary}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Results;
