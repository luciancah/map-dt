import { useCallback, useEffect, useRef, useState } from "react";

type EntityRecord = {
  id: number;
  name: string;
};

type UseNamedEntityCrudOptions<TEntity extends EntityRecord> = {
  fetchEntities: () => Promise<TEntity[]>;
  createEntity: (name: string) => Promise<TEntity>;
  updateEntity: (id: number, name: string) => Promise<TEntity>;
  deleteEntity: (id: number) => Promise<void>;
  validateName?: (name: string) => string;
};

type UseNamedEntityCrudResult<TEntity extends EntityRecord> = {
  items: TEntity[];
  listError: string;
  createError: string;
  actionError: string;
  createOpen: boolean;
  creating: boolean;
  createName: string;
  editingId: number | null;
  editingName: string;
  setCreateName: (next: string) => void;
  setEditingName: (next: string) => void;
  setCreateOpen: (next: boolean) => void;
  loadItems: () => Promise<void>;
  create: () => Promise<void>;
  beginEdit: (entity: TEntity) => void;
  cancelEdit: () => void;
  saveEdit: () => Promise<void>;
  remove: (id: number) => Promise<void>;
};

const DEFAULT_NAME_ERROR = "이름을 입력하세요.";

export function useNamedEntityCrud<TEntity extends EntityRecord>({
  fetchEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  validateName,
}: UseNamedEntityCrudOptions<TEntity>): UseNamedEntityCrudResult<TEntity> {
  const [items, setItems] = useState<TEntity[]>([]);
  const [listError, setListError] = useState("");
  const [createError, setCreateError] = useState("");
  const [actionError, setActionError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const fetchEntitiesRef = useRef(fetchEntities);

  useEffect(() => {
    fetchEntitiesRef.current = fetchEntities;
  }, [fetchEntities]);

  const loadItems = useCallback(async () => {
    const list = await fetchEntitiesRef.current();
    setItems(list);
    setListError("");
  }, []);

  const getValidationMessage = useCallback(
    (value: string) => {
      if (!value.trim()) return DEFAULT_NAME_ERROR;
      if (validateName) {
        return validateName(value);
      }

      return "";
    },
    [validateName],
  );

  const create = useCallback(async () => {
    const nextName = createName.trim();
    const validationMessage = getValidationMessage(nextName);

    if (validationMessage) {
      setCreateError(validationMessage);
      return;
    }

    setCreating(true);
    setCreateError("");
    setActionError("");

    try {
      const created = await createEntity(nextName);
      setItems((prev) => [...prev, created]);
      setCreateName("");
      setCreateOpen(false);
    } catch {
      setCreateError("생성 실패");
    } finally {
      setCreating(false);
    }
  }, [createEntity, createName, getValidationMessage]);

  const beginEdit = useCallback((entity: TEntity) => {
    setEditingId(entity.id);
    setEditingName(entity.name);
    setActionError("");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName("");
  }, []);

  const updateCreateOpen = useCallback((next: boolean) => {
    setCreateOpen(next);
    if (!next) {
      setCreateName("");
      setCreateError("");
      setActionError("");
    }
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId) return;

    const nextName = editingName.trim();
    const validationMessage = getValidationMessage(nextName);
    if (validationMessage) {
      setActionError(validationMessage);
      return;
    }

    setActionError("");

    try {
      const updated = await updateEntity(editingId, nextName);
      setItems((prev) =>
        prev.map((entity) =>
          entity.id === editingId ? { ...entity, ...updated } : entity,
        ),
      );
      cancelEdit();
    } catch {
      setActionError("수정 실패");
    }
  }, [cancelEdit, editingId, editingName, getValidationMessage, updateEntity]);

  const remove = useCallback(
    async (id: number) => {
      try {
        await deleteEntity(id);
        setItems((prev) => prev.filter((entity) => entity.id !== id));
        if (editingId === id) {
          cancelEdit();
        }
      } catch {
        setActionError("삭제 실패");
      }
    },
    [cancelEdit, deleteEntity, editingId],
  );

  useEffect(() => {
    loadItems().catch(() => {
      setListError("목록 조회 실패");
    });
  }, [loadItems]);

  return {
    items,
    listError,
    createError,
    actionError,
    createOpen,
    creating,
    createName,
    editingId,
    editingName,
    setCreateName,
    setEditingName,
    setCreateOpen: updateCreateOpen,
    loadItems,
    create,
    beginEdit,
    cancelEdit,
    saveEdit,
    remove,
  };
}
