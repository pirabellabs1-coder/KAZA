"use client";

// =============================================================================
// KAZA — Dialog client : inviter un nouveau membre dans l'équipe agence
// =============================================================================

import { useState, useTransition } from "react";
import { Mail, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast-helper";

import { inviteMember } from "@/actions/agency-team";

const ROLES = [
  { value: "DIRECTOR", label: "Directeur·rice" },
  { value: "MANAGER", label: "Manager" },
  { value: "AGENT_SENIOR", label: "Agent senior" },
  { value: "AGENT", label: "Agent" },
  { value: "INTERN", label: "Stagiaire" },
  { value: "ACCOUNTANT", label: "Comptable" },
] as const;

type RoleValue = (typeof ROLES)[number]["value"];

interface InviteMemberDialogProps {
  trigger?: React.ReactNode;
}

export function InviteMemberDialog({ trigger }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<RoleValue>("AGENT");
  const [phone, setPhone] = useState("");

  const reset = () => {
    setEmail("");
    setFullName("");
    setRole("AGENT");
    setPhone("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await inviteMember({
        email,
        fullName,
        role,
        phone: phone || undefined,
      });
      if (res.success) {
        toast.success("Invitation envoyée");
        reset();
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-kaza-navy text-white hover:bg-kaza-navy/90">
            <Mail className="mr-2 size-4" />
            Inviter un membre
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            La personne recevra l&apos;accès à l&apos;espace agence dès qu&apos;elle
            s&apos;inscrira avec cet email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-fullname">Nom complet</Label>
            <Input
              id="invite-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex : Aïcha Toko"
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email professionnel</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aicha@agence.bj"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-role">Rôle</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as RoleValue)}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-phone">Téléphone</Label>
              <Input
                id="invite-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+229 ..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-kaza-navy text-white hover:bg-kaza-navy/90"
            >
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Envoyer l&apos;invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
