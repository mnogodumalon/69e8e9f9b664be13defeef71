import { useDashboardData } from '@/hooks/useDashboardData';
import type { HalloWelt } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { HalloWeltDialog } from '@/components/dialogs/HalloWeltDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash, IconSearch, IconMessageCircle, IconX } from '@tabler/icons-react';
import { formatDate } from '@/lib/formatters';

const APPGROUP_ID = '69e8e9f9b664be13defeef71';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const {
    halloWelt,
    loading, error, fetchAll,
  } = useDashboardData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<HalloWelt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HalloWelt | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return halloWelt;
    return halloWelt.filter(r =>
      (r.fields.nachricht ?? '').toLowerCase().includes(q)
    );
  }, [halloWelt, search]);

  const handleCreate = async (fields: HalloWelt['fields']) => {
    await LivingAppsService.createHalloWeltEntry(fields);
    fetchAll();
  };

  const handleUpdate = async (fields: HalloWelt['fields']) => {
    if (!editRecord) return;
    await LivingAppsService.updateHalloWeltEntry(editRecord.record_id, fields);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteHalloWeltEntry(deleteTarget.record_id);
    fetchAll();
    setDeleteTarget(null);
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nachrichten</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {halloWelt.length === 0
              ? 'Noch keine Nachrichten'
              : `${halloWelt.length} Nachricht${halloWelt.length !== 1 ? 'en' : ''}`}
          </p>
        </div>
        <Button
          onClick={() => { setEditRecord(null); setDialogOpen(true); }}
          className="shrink-0 gap-2"
        >
          <IconPlus size={16} className="shrink-0" />
          Neue Nachricht
        </Button>
      </div>

      {/* Search */}
      {halloWelt.length > 0 && (
        <div className="relative max-w-sm">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            placeholder="Nachrichten suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSearch('')}
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      )}

      {/* Message Feed */}
      {filtered.length === 0 && halloWelt.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-dashed border-border">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <IconMessageCircle size={32} className="text-primary" stroke={1.5} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-1">Noch keine Nachrichten</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Erstelle deine erste Nachricht, um loszulegen.</p>
          </div>
          <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="gap-2">
            <IconPlus size={16} className="shrink-0" />
            Erste Nachricht erstellen
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-border">
          <IconSearch size={32} className="text-muted-foreground" stroke={1.5} />
          <p className="text-sm text-muted-foreground">Keine Nachrichten für „{search}" gefunden.</p>
          <Button variant="ghost" size="sm" onClick={() => setSearch('')}>Suche zurücksetzen</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(record => (
            <MessageCard
              key={record.record_id}
              record={record}
              onEdit={() => { setEditRecord(record); setDialogOpen(true); }}
              onDelete={() => setDeleteTarget(record)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <HalloWeltDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={editRecord ? handleUpdate : handleCreate}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['HalloWelt']}
        enablePhotoLocation={AI_PHOTO_LOCATION['HalloWelt']}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Nachricht löschen"
        description="Möchtest du diese Nachricht wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function MessageCard({
  record,
  onEdit,
  onDelete,
}: {
  record: HalloWelt;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const text = record.fields.nachricht ?? '';
  const preview = text.length > 200 ? text.slice(0, 200) + '…' : text;

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex flex-col">
      {/* Card Body */}
      <div className="p-5 flex-1 min-h-0">
        {preview ? (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {preview}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Keine Nachricht</p>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-5 pb-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
        <span className="text-xs text-muted-foreground truncate">
          {formatDate(record.createdat)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
          >
            <IconPencil size={15} className="shrink-0" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <IconTrash size={15} className="shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte lade die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Wird repariert...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte wende dich an den Support.</p>}
    </div>
  );
}
