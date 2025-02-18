import type { NetworkStatusConfig } from "@/config/routes";
import type { NetworkStatus } from "@/config/styles";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { NetworkLine } from "./NetworkLine";
import { NetworkNode } from "./NetworkNode";

interface NetworkStatusBoxProps extends NetworkStatusConfig {
  rayId?: string;
  className?: string;
}

const validLineStatus = (
  status:
    | NetworkStatusConfig["clientStatus"]
    | NetworkStatusConfig["edgeStatus"],
): NetworkStatus => {
  return status === "challenging" ? "success" : status;
};

export const NetworkStatusBox = ({
  clientStatus,
  edgeStatus,
  originStatus,
  className,
}: NetworkStatusBoxProps) => {
  const [hostname, setHostname] = useState("");

  useEffect(() => {
    const domain = window.location.hostname;
    if (domain.length <= 10) {
      setHostname(domain);
    }
  }, []);

  return (
    <div
      className={clsx(
        "w-full p-5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-100/80 dark:border-gray-800/80",
        className,
      )}
    >
      <div className="flex items-center justify-center">
        <NetworkNode label="You" status={clientStatus} />
        <NetworkLine status={validLineStatus(clientStatus)} />
        <NetworkNode label="CDN" status={edgeStatus} />

        {originStatus && (
          <>
            <NetworkLine status={validLineStatus(edgeStatus)} />
            <NetworkNode label={hostname || "Origin"} status={originStatus} />
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatusBox;
