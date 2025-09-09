
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanText, SpellCheck } from 'lucide-react';
import { Header } from '@/components/header';
import { LanguageProvider } from '@/context/language-context';

function HomeComponent() {
  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header isHomePage={true} />
        <main className="flex-grow flex items-center justify-center">
          <div className="container mx-auto p-4 md:p-8 text-center">
            <h2 className="text-4xl md:text-6xl font-headline text-primary mb-4">Welcome to Textly</h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              Your all-in-one AI-powered toolkit for text extraction and refinement. Whether you're scanning documents or perfecting your writing, Textly is here to help.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl font-headline">
                    <ScanText className="w-8 h-8 text-accent" />
                    Scan Text
                  </CardTitle>
                  <CardDescription className="pt-2">
                    Extract text from images and PDF documents with high accuracy using our advanced OCR and AI technology.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="lg">
                    <Link href="/ocr">Start Scanning</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl font-headline">
                    <SpellCheck className="w-8 h-8 text-accent" />
                    Proofread Text
                  </CardTitle>
                  <CardDescription className="pt-2">
                    Paste your text or upload a Word document to check for spelling errors and get proofreading suggestions from AI.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="lg">
                    <Link href="/proofread">Start Proofreading</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </LanguageProvider>
  );
}

export default function Home() {
  return (
    <HomeComponent />
  )
}
