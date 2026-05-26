"use client";
import { useEffect, useState } from "react";
import { Users, UserPlus, Crown, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string; role: string; inviteStatus: string; inviteEmail?: string;
  user: { id: string; name?: string; email?: string; image?: string };
}
interface Household { id: string; name: string; members: Member[] }

const ROLE_ICONS: Record<string, React.ElementType> = { OWNER: Crown, EDITOR: Pencil, VIEWER: Eye };
const ROLE_COLORS: Record<string, string> = { OWNER: "text-amber-500", EDITOR: "text-indigo-500", VIEWER: "text-gray-400" };

export default function HouseholdPage() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "VIEWER" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const res = await fetch("/api/household");
    if (res.ok) setHousehold(await res.json());
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/household", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast({ title: "Invitation sent" });
      setOpen(false);
      load();
    } catch (e: any) { toast({ title: e.message ?? "Error", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const initials = (m: Member) => (m.user.name ?? m.user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{household?.name ?? "Household"}</h2>
          <p className="text-sm text-gray-500">Manage shared finances and household members.</p>
        </div>
        <Button onClick={() => { setForm({ email: "", role: "VIEWER" }); setOpen(true); }}>
          <UserPlus className="h-4 w-4 mr-1" /> Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent>
          {!household?.members?.length && <EmptyState icon={Users} title="No members yet" description="Invite a partner or advisor to share your household finances." />}
          <div className="space-y-3">
            {household?.members.map((m) => {
              const RoleIcon = ROLE_ICONS[m.role] ?? Eye;
              return (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={m.user.image ?? ""} />
                      <AvatarFallback>{initials(m)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{m.user.name ?? m.user.email ?? m.inviteEmail}</p>
                      <p className="text-xs text-gray-400">{m.user.email ?? m.inviteEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.inviteStatus === "PENDING" && <Badge variant="warning">Pending</Badge>}
                    <div className={`flex items-center gap-1 text-xs font-medium ${ROLE_COLORS[m.role]}`}>
                      <RoleIcon className="h-3.5 w-3.5" />
                      <span>{m.role}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Permissions</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-2"><Crown className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /><div><strong className="text-gray-900 dark:text-white">Owner</strong> — Full access: manage accounts, transactions, budget, goals, and members.</div></div>
          <div className="flex items-start gap-2"><Pencil className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" /><div><strong className="text-gray-900 dark:text-white">Editor</strong> — Add and edit transactions, accounts, and budgets. Cannot manage members.</div></div>
          <div className="flex items-start gap-2"><Eye className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" /><div><strong className="text-gray-900 dark:text-white">Viewer</strong> — Read-only access to the household dashboard and reports.</div></div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Email Address</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="partner@example.com" className="mt-1" /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDITOR">Editor — can add/edit data</SelectItem>
                  <SelectItem value="VIEWER">Viewer — read only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={invite} disabled={saving || !form.email}>{saving ? "Sending…" : "Send Invite"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
