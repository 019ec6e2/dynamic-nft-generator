import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  transaction_id: string;
  mint: string;
  buyer: string;
  seller: string;
  timestamp: string;
  imageUrl?: string;
  amount?: number;
  currency?: string;
  marketplace?: string;
  evolvedTx?: string;
}

function truncateAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Gallery() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery<Transaction[]>({
    queryKey: ["/api/recent-transactions"],
  });

  const regenerateImageMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await fetch(`/api/regenerate-image/${transactionId}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to regenerate image");
      }
      return response.json();
    },
    onSuccess: (data, transactionId) => {
      // Update the transaction in the cache with the new image URL
      queryClient.setQueryData<Transaction[]>(["/api/recent-transactions"], (old) =>
        old?.map((tx) =>
          tx.transaction_id === transactionId
            ? { ...tx, imageUrl: data.imageUrl }
            : tx
        )
      );
      toast({
        title: "Image regenerated",
        description: "The NFT image has been successfully regenerated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to regenerate image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMetadataMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await fetch(`/api/update-metadata/${transactionId}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to update metadata");
      }
      return response.json();
    },
    onSuccess: (data, transactionId) => {
      // Update the transaction in the cache to mark it as evolved
      queryClient.setQueryData<Transaction[]>(["/api/recent-transactions"], (old) =>
        old?.map((tx) =>
          tx.transaction_id === transactionId
            ? { ...tx, evolvedTx: 'true' }
            : tx
        )
      );
      toast({
        title: "Metadata updated",
        description: "The NFT metadata has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update metadata. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">
              Error loading transactions: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Recent NFT Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Latest NFT transactions with generated artwork
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[800px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transactions?.map((tx) => (
                <Card key={tx.transaction_id}>
                  <CardContent className="p-4">
                    <div className="relative">
                      {tx.imageUrl && (
                        <img
                          src={tx.imageUrl}
                          alt={`NFT ${tx.mint}`}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateImageMutation.mutate(tx.transaction_id)}
                          disabled={regenerateImageMutation.isPending}
                        >
                          {regenerateImageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          <span className="sr-only">Regenerate Image</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateMetadataMutation.mutate(tx.transaction_id)}
                          disabled={updateMetadataMutation.isPending || tx.evolvedTx === 'true'}
                          className={tx.evolvedTx === 'true' ? 'bg-green-100' : ''}
                        >
                          {updateMetadataMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          <span className="sr-only">Update Metadata</span>
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {tx.amount && tx.currency && (
                          <span className="block text-lg font-semibold mb-2">
                            {tx.amount} {tx.currency}
                          </span>
                        )}
                        <span className="block text-muted-foreground">
                          Mint: {truncateAddress(tx.mint)}
                        </span>
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <p>From: {truncateAddress(tx.seller)}</p>
                        <p>To: {truncateAddress(tx.buyer)}</p>
                        <p>
                          Date:{" "}
                          {new Date(tx.timestamp).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        {tx.marketplace && (
                          <p className="mt-2 text-xs">Via: {tx.marketplace}</p>
                        )}
                        {tx.evolvedTx === 'true' && (
                          <p className="mt-2 text-xs text-green-600">Metadata Updated ✓</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}