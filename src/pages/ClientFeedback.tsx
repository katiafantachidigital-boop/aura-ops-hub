import { useState } from "react";
import { Star, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ClientFeedback() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma avaliação com as estrelas");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('client_feedbacks').insert({
      rating,
      comment: comment.trim() || null,
    });

    setLoading(false);

    if (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Erro ao enviar avaliação. Tente novamente.");
      return;
    }

    setSubmitted(true);
    toast.success("Obrigada pela sua avaliação!");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Obrigada!</h1>
            <p className="text-muted-foreground">
              Sua avaliação foi enviada com sucesso. Agradecemos muito por compartilhar sua experiência conosco!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Sua opinião é muito importante!</h1>
            <p className="text-muted-foreground">
              Esta página foi criada especialmente para você. Nos avalie e conte como foi sua experiência.
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none focus:scale-110"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground mb-4">
              {rating === 1 && "Muito insatisfeito"}
              {rating === 2 && "Insatisfeito"}
              {rating === 3 && "Regular"}
              {rating === 4 && "Satisfeito"}
              {rating === 5 && "Muito satisfeito"}
            </p>
          )}

          {/* Comment Field */}
          <div className="mb-6">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência... (opcional)"
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            size="lg"
            disabled={loading || rating === 0}
          >
            {loading ? (
              "Enviando..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Avaliação
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
