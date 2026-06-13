import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, MapPin, Phone, Package } from "lucide-react";

interface RecyclingSubmission {
  id: string;
  user_id: string;
  mass_kg: number;
  points_earned: number;
  phone: string;
  address: any;
  notes: string | null;
  status: string;
  created_at: string;
  verified_by: string | null;
  profile?: { display_name: string | null; phone: string | null } | null;
}

interface RecyclingTabProps {
  submissions: RecyclingSubmission[];
  onUpdate: (id: string, status: string) => void;
}

export function RecyclingTab({ submissions, onUpdate }: RecyclingTabProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);

  const approveSubmission = async (id: string) => {
    setProcessing(id);
    const { error } = await supabase.rpc("approve_recycling_submission", {
      _submission_id: id,
      _admin_id: (await supabase.auth.getUser()).data.user?.id!,
    });
    setProcessing(null);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
      return;
    }
    onUpdate(id, "approved");
    toast({ title: "Submission approved & points credited" });
  };

  const rejectSubmission = async (id: string) => {
    setProcessing(id);
    const { error } = await supabase
      .from("recycling_submissions")
      .update({ status: "rejected" })
      .eq("id", id);
    setProcessing(null);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
      return;
    }
    onUpdate(id, "rejected");
    toast({ title: "Submission rejected" });
  };

  const statusBadgeVariant = (status: string) => {
    if (status === "approved") return "default" as const;
    if (status === "rejected") return "destructive" as const;
    return "secondary" as const;
  };

  const pending = submissions.filter((s) => s.status === "pending");
  const rest = submissions.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Pending Review ({pending.length})
        </h3>
      )}
      {[...pending, ...rest].map((s) => (
        <Card key={s.id} className={s.status === "pending" ? "border-amber-500/50" : ""}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{s.profile?.display_name || "User"}</span>
                  <Badge variant={statusBadgeVariant(s.status)}>{s.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    {s.mass_kg} kg → {s.points_earned} pts
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {s.phone}
                  </span>
                </div>
                {s.address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {[s.address.street, s.address.city, s.address.governorate].filter(Boolean).join(", ")}
                  </p>
                )}
                {s.notes && <p className="text-xs text-muted-foreground italic">"{s.notes}"</p>}
              </div>
              {s.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => approveSubmission(s.id)}
                    disabled={processing === s.id}
                  >
                    <CheckCircle className="h-4 w-4 me-1" />
                    {t("approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectSubmission(s.id)}
                    disabled={processing === s.id}
                  >
                    <XCircle className="h-4 w-4 me-1" />
                    {t("reject")}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {submissions.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No recycling submissions yet.</p>
      )}
    </div>
  );
}
