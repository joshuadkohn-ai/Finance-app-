"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, Shield } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [notifications, setNotifications] = useState({ overBudget: true, largeTx: true, upcomingBills: true, lowBalance: true, goalProgress: true });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState("");
  const [importing, setImporting] = useState(false);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();

  useState(() => { fetch("/api/accounts").then(r => r.json()).then(setAccounts); });

  const saveProfile = async () => {
    const res = await fetch("/api/settings/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    toast({ title: res.ok ? "Profile updated" : "Error", variant: res.ok ? "default" : "destructive" });
  };

  const importCsv = async () => {
    if (!csvFile || !accountId) { toast({ title: "Select a file and account", variant: "destructive" }); return; }
    setImporting(true);
    const fd = new FormData();
    fd.append("file", csvFile);
    fd.append("accountId", accountId);
    fd.append("mapping", JSON.stringify({ date: "Date", merchant: "Description", amount: "Amount" }));
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      toast({ title: `Imported ${data.imported} transactions, skipped ${data.skipped}` });
    } catch { toast({ title: "Import failed", variant: "destructive" }); }
    finally { setImporting(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="import">Import / Export</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Display Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
              <div><Label>Email</Label><Input value={session?.user?.email ?? ""} disabled className="mt-1 opacity-60" /></div>
              <Button onClick={saveProfile}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {([
                ["overBudget", "Over budget alerts"],
                ["largeTx", "Large transaction alerts"],
                ["upcomingBills", "Upcoming bill reminders"],
                ["lowBalance", "Low balance warnings"],
                ["goalProgress", "Goal progress reminders"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="cursor-pointer">{label}</Label>
                  <Switch checked={notifications[key]} onCheckedChange={(v) => setNotifications((n) => ({ ...n, [key]: v }))} />
                </div>
              ))}
              <Button onClick={() => toast({ title: "Preferences saved" })}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Import Transactions (CSV)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-500">Upload a CSV file exported from your bank. We expect columns: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">Date, Description, Amount</code>.</p>
                <div>
                  <Label>Select Account</Label>
                  <select className="mt-1 flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                    <option value="">Choose account…</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>CSV File</Label>
                  <input type="file" accept=".csv" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} />
                </div>
                <Button onClick={importCsv} disabled={importing}><Upload className="h-4 w-4 mr-1" />{importing ? "Importing…" : "Import"}</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Export Data</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-500">Export your financial data as CSV files.</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={async () => { const r = await fetch("/api/transactions?limit=10000"); const d = await r.json(); const csv = ["Date,Merchant,Amount,Type,Category,Account", ...(d.transactions ?? []).map((t: any) => `${t.date},${t.merchant},${t.amount},${t.type},${t.category?.name ?? ""},${t.account?.name ?? ""}`)].join("\n"); const b = new Blob([csv], { type: "text/csv" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "transactions.csv"; a.click(); }}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Transactions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle>Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
                </div>
                <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Change Password</p>
                <div className="space-y-2">
                  <Input type="password" placeholder="Current password" />
                  <Input type="password" placeholder="New password (min 8 chars)" />
                  <Input type="password" placeholder="Confirm new password" />
                  <Button variant="outline" onClick={() => toast({ title: "Password change coming soon", variant: "default" })}>Update Password</Button>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm font-medium text-red-600 mb-2">Danger Zone</p>
                <Button variant="destructive" size="sm" onClick={() => toast({ title: "Account deletion requires support contact", variant: "destructive" })}>Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
