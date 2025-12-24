import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, DollarSign, TrendingUp } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { getAdminDashboardStatsService } from "@/services";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await getAdminDashboardStatsService();
        if (response?.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const statCards = [
    {
      icon: Users,
      label: t("admin.totalUsers") || "Total Users",
      value: stats?.stats?.users?.total || 0,
      description: `${stats?.stats?.users?.students || 0} students, ${stats?.stats?.users?.instructors || 0} instructors`,
    },
    {
      icon: BookOpen,
      label: t("admin.totalCourses") || "Total Courses",
      value: stats?.stats?.courses?.total || 0,
      description: `${stats?.stats?.courses?.published || 0} published, ${stats?.stats?.courses?.draft || 0} draft`,
    },
    {
      icon: DollarSign,
      label: t("admin.totalRevenue") || "Total Revenue",
      value: `$${((stats?.stats?.revenue?.total || 0) / 100).toFixed(2)}`,
      description: `${stats?.stats?.revenue?.orders || 0} completed orders`,
    },
    {
      icon: TrendingUp,
      label: t("admin.growth") || "Growth",
      value: "+12%",
      description: "This month",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("admin.adminDashboard") || "Admin Dashboard"}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("admin.people") || "People"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{t("admin.instructorManagement") || "Instructor Management"}</p>
            <p className="text-sm text-muted-foreground">
              {t("admin.instructorsList") || "Manage instructors in a dedicated view"}
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/instructors">
              {t("common.view") || "View"}
            </Link>
          </Button>
        </CardContent>
      </Card>
      {stats?.recentUsers && stats.recentUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.recentUsers") || "Recent Users"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{user.userName}</p>
                    <p className="text-sm text-muted-foreground">{user.userEmail}</p>
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? t("admin.active") || "Active" : t("admin.inactive") || "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminDashboard;

