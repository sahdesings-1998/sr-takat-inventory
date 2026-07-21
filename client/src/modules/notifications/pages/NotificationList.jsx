import { useEffect } from "react";
import { Bell, Check, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { useToast } from "@/contexts/ToastContext";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";

export default function NotificationList() {
  const { notifications, isLoading, isError, markAsRead } = useNotifications();
  const { showSuccess, showError } = useToast();

  const [markingId, setMarkingId] = useState(null);

  useEffect(() => {
    if (isError) {
      showError("Fetch Failed", "Failed to fetch notifications.");
    }
  }, [isError, showError]);

  const handleMarkRead = async (id) => {
    try {
      setMarkingId(id);
      await markAsRead(id);
      showSuccess("Notification Read", "Marked alert notification as read.");
    } catch (err) {
      showError("Action Failed", "Failed to mark notification as read.");
    } finally {
      setMarkingId(null);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "warning":
      case "low_stock":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "danger":
      case "overdue_memo":
        return <AlertCircle className="h-5 w-5 text-danger" />;
      case "success":
        return <Check className="h-5 w-5 text-success" />;
      default:
        return <Info className="h-5 w-5 text-info" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size={40} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-8 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-500 shadow-sm">
        Failed to fetch notifications.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">Notifications</h1>
        <p className="text-sm text-gray-600 mt-1 font-medium">System alerts including low stock, overdue memos, and missing certificate warnings</p>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" /> Recent Alerts (
            {notifications.filter((n) => !n.isRead).length} unread)
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col divide-y divide-gray-100 p-0">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-600 mt-1 font-medium">No notifications found</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                className={`flex items-start justify-between gap-4 p-6 transition-colors ${notif.isRead ? "bg-white" : "bg-gray-50/50 border-l-4 border-accent"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(notif.type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-medium ${notif.isRead ? "text-gray-700" : "text-gray-900 font-semibold"
                          }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && <Badge variant="accent">New</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!notif.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={markingId === notif._id}
                    onClick={() => handleMarkRead(notif._id)}
                    className="shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark Read
                  </Button>
                )}
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
