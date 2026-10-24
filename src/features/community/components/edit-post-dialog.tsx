"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Post } from "@/features/community/types";
import { MAX_POST_LENGTH } from "@/features/community/components/post-composer";
import { demoActions } from "@/features/demo/store";

function EditForm({ post, onDone }: { post: Post; onDone: () => void }) {
  const [body, setBody] = useState(post.body);
  const [spoiler, setSpoiler] = useState(post.containsSpoiler);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const text = body.trim();
        if (text.length < 3)
          return setError("Dein Beitrag braucht mindestens 3 Zeichen.");
        if (text.length > MAX_POST_LENGTH)
          return setError(
            `Dein Beitrag ist ${text.length - MAX_POST_LENGTH} Zeichen zu lang.`,
          );
        demoActions.updatePost(post.id, {
          body: text,
          containsSpoiler: spoiler,
        });
        toast.success("Änderungen gespeichert");
        onDone();
      }}
    >
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">
          Beitrag bearbeiten
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="edit-post-body">Text</Label>
        <Textarea
          id="edit-post-body"
          value={body}
          rows={6}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "edit-post-error" : undefined}
          onChange={(event) => {
            setBody(event.target.value);
            setError(null);
          }}
        />
        <p className="text-right text-xs text-muted-foreground tabular">
          {MAX_POST_LENGTH - body.length} Zeichen übrig
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <Switch
          checked={spoiler}
          onCheckedChange={(checked) => setSpoiler(checked)}
        />
        Enthält Spoiler
      </label>
      {error && (
        <p
          id="edit-post-error"
          role="alert"
          className="text-sm font-medium text-destructive"
        >
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Abbrechen
        </Button>
        <Button type="submit">Speichern</Button>
      </DialogFooter>
    </form>
  );
}

export function EditPostDialog({
  open,
  onOpenChange,
  post,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && <EditForm post={post} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
