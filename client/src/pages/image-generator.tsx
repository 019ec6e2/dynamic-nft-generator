import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ImageIcon, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ImageGenerator() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to generate image");
      }

      const data = await response.json();
      return data.imageUrl;
    },
    onSuccess: (url) => {
      setImageUrl(url);
      setCopied(false);
    },
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl!);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Image URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Image Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating AI Art...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate New AI Art
              </>
            )}
          </Button>

          {imageUrl && (
            <div className="mt-4 space-y-4">
              <img 
                src={imageUrl} 
                alt="Generated AI artwork" 
                className="rounded-lg shadow-lg w-full max-w-2xl mx-auto"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Image URL
                  </>
                )}
              </Button>
            </div>
          )}

          {generateMutation.isError && (
            <p className="text-red-500 text-sm mt-2">
              {generateMutation.error instanceof Error 
                ? generateMutation.error.message 
                : "Error generating image. Please try again."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}