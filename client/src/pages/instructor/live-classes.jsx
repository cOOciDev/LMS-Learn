import LiveClassesManager from "@/components/instructor-view/live-classes";
import CreateLivePlan from "@/components/instructor-view/live-classes/create-live-plan";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstructorContext } from "@/context/instructor-context";
import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

function InstructorLiveClassesPage() {
  const { instructorCoursesList } = useContext(InstructorContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "manage";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Organize recurring live classes, publish plans, and track attendance requirements.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 flex flex-wrap gap-2 rounded-xl bg-muted/40 p-1">
          <TabsTrigger value="manage" className="px-4 py-2 text-sm font-medium">
            Manage Plans
          </TabsTrigger>
          <TabsTrigger value="create" className="px-4 py-2 text-sm font-medium">
            Create Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <LiveClassesManager />
        </TabsContent>

        <TabsContent value="create">
          <CreateLivePlan instructorCoursesList={instructorCoursesList} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default InstructorLiveClassesPage;

