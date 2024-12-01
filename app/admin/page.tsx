"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  LineChart, 
  BarChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalImages: number;
  processingSuccess: number;
  recentActivity: any[];
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalImages: 0,
    processingSuccess: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify admin session on component mount
    const checkAdminSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/auth/login';
        return;
      }

      try {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role, is_active')
          .eq('user_id', session.user.id)
          .single();

        if (roleError || !roleData || roleData.role !== 'ADMIN' || !roleData.is_active) {
          throw new Error('Unauthorized access');
        }

        // Fetch dashboard stats
        await fetchDashboardStats();
      } catch (error) {
        console.error('Admin verification error:', error);
        window.location.href = '/auth/login';
      }
    };

    checkAdminSession();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [usersData, imagesData, activityData] = await Promise.all([
        supabase
          .from('user_roles')
          .select('*', { count: 'exact' }),
        supabase
          .from('images')
          .select('*', { count: 'exact' }),
        supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      setStats({
        totalUsers: usersData.count || 0,
        activeUsers: usersData.data?.filter(u => u.is_active).length || 0,
        totalImages: imagesData.count || 0,
        processingSuccess: imagesData.data?.filter(i => i.status === 'COMPLETED').length || 0,
        recentActivity: activityData.data || []
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={fetchDashboardStats}>Refresh Data</Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalImages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {((stats.processingSuccess / stats.totalImages) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentActivity.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>{activity.user_email}</TableCell>
                      <TableCell>
                        {new Date(activity.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Input
                  placeholder="Search users..."
                  className="max-w-sm"
                />
                <Button>Export Users</Button>
              </div>
              {/* Add user management table here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Image Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Input
                  placeholder="Search images..."
                  className="max-w-sm"
                />
                <Button>Export Data</Button>
              </div>
              {/* Add image management table here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add settings form here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}