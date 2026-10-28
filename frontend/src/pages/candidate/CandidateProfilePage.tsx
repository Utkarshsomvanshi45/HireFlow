import { Paperclip, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/format";
import { setSession } from "@/services/session.service";
import type { User } from "@/types";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  bio: string;
}

export function CandidateProfilePage() {
  const session = useSession();
  const user = session === "loading" || session === null ? null : session.user;

  const [form, setForm] = useState<ProfileForm | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "My Profile — HireFlow";
  }, []);

  useEffect(() => {
    if (!user || form) return;
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      location: user.location ?? "",
      title: user.title ?? "",
      bio: user.bio ?? "",
    });
    setResumeName(user.resumeName ?? "");
  }, [user, form]);

  if (session === "loading" || !form) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-96 rounded-xl border border-border bg-card" />
      </div>
    );
  }

  const update = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleResume = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please choose a PDF resume.");
      event.target.value = "";
      return;
    }
    setResumeName(file.name);
    toast.success("Resume attached", {
      description: "PDF upload to storage lands with the backend integration.",
    });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    const updated: User = {
      ...user!,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      location: form.location.trim() || undefined,
      title: form.title.trim() || undefined,
      bio: form.bio.trim() || undefined,
      resumeName: resumeName || undefined,
      resumeUpdatedAt: resumeName ? new Date().toISOString().slice(0, 10) : user!.resumeUpdatedAt,
    };
    setSession({ user: updated });
    setSaving(false);
    toast.success("Profile saved");
  };

  return (
    <>
      <PageHeading
        title="My profile"
        description="This information is attached to every application you submit."
      />

      <form className="grid gap-6 lg:grid-cols-[1fr_320px]" onSubmit={save} noValidate>
        <Card className="card-shadow">
          <CardContent className="space-y-5 p-6">
            <h2 className="font-display text-lg font-semibold">Profile information</h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full name *</Label>
                <Input
                  id="profile-name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
                {errors.name ? (
                  <p role="alert" className="text-xs font-medium text-destructive">{errors.name}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email *</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : undefined}
                />
                {errors.email ? (
                  <p role="alert" className="text-xs font-medium text-destructive">{errors.email}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="+1 555 000 0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-location">Location</Label>
                <Input
                  id="profile-location"
                  value={form.location}
                  onChange={(event) => update("location", event.target.value)}
                  placeholder="e.g. Bengaluru, India"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-title">Professional headline</Label>
              <Input
                id="profile-title"
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-bio">About you</Label>
              <Textarea
                id="profile-bio"
                rows={4}
                value={form.bio}
                onChange={(event) => update("bio", event.target.value)}
                placeholder="A short paragraph recruiters will see first."
              />
            </div>

            <Button type="submit" disabled={saving}>
              <Save aria-hidden />
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </CardContent>
        </Card>

        <Card className="card-shadow h-fit">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-lg font-semibold">Resume</h2>
            {resumeName ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
                <Paperclip className="size-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{resumeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.resumeUpdatedAt ? `Updated ${formatDate(user.resumeUpdatedAt)}` : "PDF resume"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No resume attached yet. Applications are stronger with one.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="profile-resume">Attach a new resume (PDF)</Label>
              <Input
                id="profile-resume"
                type="file"
                accept=".pdf"
                onChange={handleResume}
                className="file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              In this prototype the resume file name is stored with your demo
              profile; the file upload goes to server storage once the backend
              is connected.
            </p>
          </CardContent>
        </Card>
      </form>
    </>
  );
}

