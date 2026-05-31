"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Send, EyeOff, Trash2, ArrowLeft } from "lucide-react";

import {
  createArticle,
  updateArticle,
  setArticleStatus,
  deleteArticle,
  type ArticleInput,
} from "@/actions/articles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast-helper";
import { RichTextEditor } from "./rich-text-editor";

export interface EditorArticle {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  category: string | null;
  status: "DRAFT" | "PUBLISHED";
  slug: string;
}

interface ArticleEditorFormProps {
  /** Article existant (édition) ou undefined (création). */
  article?: EditorArticle;
  /** Base de redirection : "/admin/articles" ou "/redaction". */
  basePath: string;
}

export function ArticleEditorForm({ article, basePath }: ArticleEditorFormProps) {
  const router = useRouter();
  const [id, setId] = useState<string | undefined>(article?.id);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    article?.status ?? "DRAFT",
  );
  const [title, setTitle] = useState(article?.title ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [category, setCategory] = useState(article?.category ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    article?.coverImageUrl ?? "",
  );
  const [content, setContent] = useState(article?.content ?? "");
  const [isPending, startTransition] = useTransition();

  function payload(): ArticleInput {
    return {
      title,
      excerpt: excerpt || undefined,
      category: category || undefined,
      coverImageUrl: coverImageUrl || undefined,
      content,
    };
  }

  function handleSave() {
    if (!title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    startTransition(async () => {
      if (id) {
        const res = await updateArticle(id, payload());
        if (res.success) toast.success("Article enregistré.");
        else toast.error(res.error ?? "Échec de l'enregistrement.");
      } else {
        const res = await createArticle(payload());
        if (res.success && res.id) {
          setId(res.id);
          toast.success("Brouillon créé.");
          router.replace(`${basePath}/${res.id}`);
        } else {
          toast.error(res.error ?? "Échec de la création.");
        }
      }
    });
  }

  function handlePublishToggle() {
    if (!id) {
      toast.error("Enregistrez d'abord le brouillon.");
      return;
    }
    const next = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    startTransition(async () => {
      const res = await setArticleStatus(id, next);
      if (res.success) {
        setStatus(next);
        toast.success(next === "PUBLISHED" ? "Article publié." : "Dépublié.");
      } else {
        toast.error(res.error ?? "Échec.");
      }
    });
  }

  function handleDelete() {
    if (!id) {
      router.push(basePath);
      return;
    }
    if (!window.confirm("Supprimer définitivement cet article ?")) return;
    startTransition(async () => {
      const res = await deleteArticle(id);
      if (res.success) {
        toast.success("Article supprimé.");
        router.push(basePath);
      } else {
        toast.error(res.error ?? "Échec de la suppression.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Retour aux articles
        </button>
        <div className="flex items-center gap-2">
          <Badge
            className={
              status === "PUBLISHED"
                ? "bg-kaza-green/10 text-kaza-green"
                : "bg-amber-100 text-amber-700"
            }
          >
            {status === "PUBLISHED" ? "Publié" : "Brouillon"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="text-rose-600 hover:text-rose-700"
          >
            <Trash2 className="mr-1.5 size-4" /> Supprimer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePublishToggle}
            disabled={isPending}
          >
            {status === "PUBLISHED" ? (
              <>
                <EyeOff className="mr-1.5 size-4" /> Dépublier
              </>
            ) : (
              <>
                <Send className="mr-1.5 size-4" /> Publier
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="bg-kaza-navy hover:bg-kaza-navy/90"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 size-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="art-title">Titre</Label>
          <Input
            id="art-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de l'article"
            className="text-lg font-semibold"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="art-cat">Catégorie</Label>
          <Input
            id="art-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex. Marché, Conseils…"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="art-cover">Image de couverture (URL)</Label>
        <Input
          id="art-cover"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="art-excerpt">Chapô / résumé</Label>
        <Textarea
          id="art-excerpt"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Court résumé affiché dans la liste des articles."
        />
      </div>

      <div className="space-y-2">
        <Label>Contenu</Label>
        <RichTextEditor value={content} onChange={setContent} />
      </div>
    </div>
  );
}
