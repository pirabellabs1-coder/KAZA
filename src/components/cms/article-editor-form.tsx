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

export interface WriterChoice {
  id: string;
  name: string;
  role: string;
}

export interface EditorArticle {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  category: string | null;
  status: "DRAFT" | "PUBLISHED";
  slug: string;
  authorId: string | null;
  authorName: string | null;
  authorRole: string | null;
}

interface ArticleEditorFormProps {
  /** Article existant (édition) ou undefined (création). */
  article?: EditorArticle;
  /** Base de redirection : "/admin/articles" ou "/redaction". */
  basePath: string;
  /** Rédacteurs sélectionnables (admins + contributeurs). */
  writers?: WriterChoice[];
  /** L'utilisateur courant peut-il choisir le rédacteur (admin) ? */
  canChooseAuthor?: boolean;
}

export function ArticleEditorForm({
  article,
  basePath,
  writers = [],
  canChooseAuthor = false,
}: ArticleEditorFormProps) {
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
  const [authorId, setAuthorId] = useState(article?.authorId ?? "");
  const [authorName, setAuthorName] = useState(article?.authorName ?? "");
  const [authorRole, setAuthorRole] = useState(article?.authorRole ?? "");
  const [isPending, startTransition] = useTransition();

  function handleAuthorSelect(value: string) {
    setAuthorId(value);
    // Pré-remplit la signature affichée si elle est vide.
    const w = writers.find((x) => x.id === value);
    if (w && !authorName.trim()) setAuthorName(w.name);
  }

  function payload(): ArticleInput {
    return {
      title,
      excerpt: excerpt || undefined,
      category: category || undefined,
      coverImageUrl: coverImageUrl || undefined,
      content,
      authorId: canChooseAuthor && authorId ? authorId : undefined,
      authorName: authorName || undefined,
      authorRole: authorRole || undefined,
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

      {/* ---- Rédacteur / signature ---- */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="mb-3 text-sm font-semibold text-kaza-navy">Rédacteur</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {canChooseAuthor && writers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="art-author">Compte rédacteur</Label>
              <select
                id="art-author"
                value={authorId}
                onChange={(e) => handleAuthorSelect(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">— Sélectionner —</option>
                {writers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.role})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="art-author-name">Signature affichée</Label>
            <Input
              id="art-author-name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ex. Aïcha Adjovi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="art-author-role">Fonction affichée</Label>
            <Input
              id="art-author-role"
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              placeholder="Ex. Conseillère KAZA"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          La signature s&apos;affiche sur l&apos;article public. Si elle est
          vide, le nom du compte rédacteur est utilisé.
        </p>
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
