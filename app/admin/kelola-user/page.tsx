"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, Search, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  idAdmin: number;
  username: string;
  role: string;
}

function UserForm({
  user,
  onSave,
  onCancel,
}: {
  user?: User;
  onSave: (userData: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    password: "",
    role: user?.role || "admin",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          required
          minLength={3}
        />
      </div>
      <div>
        <Label htmlFor="password">
          Password {user ? "(kosongkan jika tidak ingin mengubah)" : ""}
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required={!user}
          minLength={6}
        />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            {/* <SelectItem value="super_admin">Super Admin</SelectItem> */}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">{user ? "Update" : "Tambah"} User</Button>
      </div>
    </form>
  );
}

export default function KelolaUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user-management`
      );
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        toast({
          title: "Error",
          description: "Gagal mengambil data pengguna",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data pengguna",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (userData: any) => {
    try {
      const url = editingUser
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/user-management/${editingUser.idAdmin}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/user-management`;

      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Berhasil",
          description: data.message,
        });
        fetchUsers();
        setIsDialogOpen(false);
        setEditingUser(null);
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data pengguna",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user-management/${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Berhasil",
          description: data.message,
        });
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus pengguna",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-6 space-y-4 lg:space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="relative overflow-hidden rounded-xl lg:rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-4 lg:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-balance">
              👥 Kelola User
            </h1>
            <p className="text-blue-100 text-sm lg:text-lg text-pretty">
              Kelola pengguna admin sistem BPKAD Kabupaten Garut
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditingUser(null)}
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg font-semibold w-full md:w-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Tambah User</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Edit User" : "Tambah User Baru"}
                </DialogTitle>
              </DialogHeader>
              <UserForm
                user={editingUser || undefined}
                onSave={handleSaveUser}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingUser(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600"></div>
          <CardHeader className="relative text-white pb-2 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs lg:text-lg font-medium text-emerald-100">
                  Total User
                </CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1">
                  {users.length}
                </div>
              </div>
              <div className="p-2 lg:p-3 bg-white/20 rounded-full shrink-0">
                <Users className="h-4 w-4 lg:h-6 lg:w-6" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600"></div>
          <CardHeader className="relative text-white pb-2 p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xs lg:text-lg font-medium text-blue-100">
                  Admin
                </CardTitle>
                <div className="text-lg lg:text-2xl font-bold mt-1">
                  {users.filter((user) => user.role === "admin").length}
                </div>
              </div>
              <div className="p-2 lg:p-3 bg-white/20 rounded-full shrink-0">
                <FileText className="h-4 w-4 lg:h-6 lg:w-6" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <Search className="h-4 w-4 text-blue-600" />
            </div>
            <Input
              placeholder="Cari username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-blue-200 focus:border-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b p-4 lg:p-6">
          <CardTitle className="text-base lg:text-xl text-slate-800">
            👥 Data Pengguna
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold text-slate-700 px-4 lg:px-6 min-w-[80px]">
                    ID
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 px-4 lg:px-6 min-w-[150px]">
                    Username
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center min-w-[120px]">
                    Role
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700 min-w-[100px] lg:min-w-[120px]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-100 rounded-full">
                          <Users className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="text-slate-500 font-medium">
                          {searchTerm
                            ? "Tidak ada pengguna yang ditemukan"
                            : "Belum ada pengguna"}
                        </div>
                        <div className="text-sm text-slate-400">
                          Silakan tambah pengguna baru
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.idAdmin}
                      className="bg-white hover:bg-slate-50/30"
                    >
                      <TableCell className="px-4 lg:px-6 py-3 text-slate-600 font-medium">
                        {user.idAdmin}
                      </TableCell>
                      <TableCell className="px-4 lg:px-6 py-3 font-medium text-slate-800">
                        {user.username}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium",
                            user.role === "super_admin"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          )}
                        >
                          {user.role === "super_admin"
                            ? "Super Admin"
                            : "Admin"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 lg:gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setIsDialogOpen(true);
                            }}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 h-7 w-7 lg:h-8 lg:w-8 p-0"
                          >
                            <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.idAdmin)}
                            className="border-red-200 text-red-600 hover:bg-red-50 h-7 w-7 lg:h-8 lg:w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
