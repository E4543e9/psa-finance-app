"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Plus, LogIn, Users } from "lucide-react";

interface GroupMember {
  id: string;
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
}

interface Group {
  id: string;
  name: string;
  joinCode: string;
  role: string;
  memberCount: number;
  members: GroupMember[];
  createdAt: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/groups");
    const data = await res.json();
    setGroups(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  async function handleCreate() {
    if (!groupName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName }),
    });
    if (res.ok) {
      toast.success("สร้างกลุ่มสำเร็จ");
      setGroupName("");
      setShowCreate(false);
      fetchGroups();
    } else toast.error("เกิดข้อผิดพลาด");
    setCreating(false);
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setJoining(true);
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joinCode }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`เข้าร่วม "${data.groupName}" สำเร็จ`);
      setJoinCode("");
      setShowJoin(false);
      fetchGroups();
    } else toast.error(data.error ?? "เกิดข้อผิดพลาด");
    setJoining(false);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("คัดลอก code แล้ว");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold hidden lg:block">กลุ่ม / บ้าน</h1>
          <p className="text-sm text-muted-foreground mt-1">จัดการกลุ่มสำหรับแบ่งค่าใช้จ่าย</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowJoin(!showJoin)}>
            <LogIn size={15} /> เข้าร่วมกลุ่ม
          </Button>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus size={15} /> สร้างกลุ่ม
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="font-medium text-sm">สร้างกลุ่มใหม่</p>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="ชื่อกลุ่ม เช่น บ้านเช่า, ครอบครัว"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
              <Button size="sm" disabled={creating} onClick={handleCreate}>
                {creating ? "กำลังสร้าง..." : "สร้างกลุ่ม"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join form */}
      {showJoin && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="font-medium text-sm">เข้าร่วมกลุ่ม</p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="กรอก Code เช่น A3KH7P"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-ring tracking-widest font-mono"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowJoin(false)}>ยกเลิก</Button>
              <Button size="sm" disabled={joining} onClick={handleJoin}>
                {joining ? "กำลังเข้าร่วม..." : "เข้าร่วม"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group list */}
      {loading ? (
        <p className="text-muted-foreground text-sm">กำลังโหลด...</p>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">ยังไม่มีกลุ่ม</p>
            <p className="text-xs mt-1">สร้างกลุ่มหรือเข้าร่วมด้วย code</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base">{g.name}</h3>
                      <Badge variant={g.role === "OWNER" ? "default" : "outline"} className="text-xs">
                        {g.role === "OWNER" ? "เจ้าของ" : "สมาชิก"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Code:</span>
                      <code className="text-sm font-bold tracking-widest text-primary">{g.joinCode}</code>
                      <button onClick={() => copyCode(g.joinCode)} className="text-muted-foreground hover:text-foreground">
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{g.memberCount} คน</span>
                </div>

                <div className="space-y-2">
                  {g.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 py-2 border-t border-border first:border-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">@{m.userId}</p>
                      </div>
                      {m.role === "OWNER" && (
                        <Badge variant="outline" className="text-xs">เจ้าของ</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
