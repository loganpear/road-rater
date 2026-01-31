import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { VideoUploader } from '@/components/upload/VideoUploader';
import { Clock, FileVideo, Shield } from 'lucide-react';

const Upload = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Page header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Upload Your <span className="text-gradient">Dashcam Video</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Let our AI analyze your driving and provide detailed safety feedback
            </p>
          </div>

          {/* Uploader */}
          <VideoUploader />

          {/* Info cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-card/50 border border-border">
              <div className="p-2 rounded-lg bg-primary/20">
                <FileVideo className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Supported Formats</h3>
                <p className="text-sm text-muted-foreground">MP4 and MOV files up to 500MB</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-card/50 border border-border">
              <div className="p-2 rounded-lg bg-primary/20">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Quick Analysis</h3>
                <p className="text-sm text-muted-foreground">Results in under 30 seconds</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-card/50 border border-border">
              <div className="p-2 rounded-lg bg-primary/20">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Privacy First</h3>
                <p className="text-sm text-muted-foreground">Videos are processed securely</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Upload;
