import { toast } from "react-toastify";

async function postData(url = "", data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json"
    },
    
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *client
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return response; // parses JSON response into native JavaScript objects
}

async function showResponse(response, command, showSuccess) {
  if (!response.ok) {
    toast.error(`Game server failed to return for ${command}`);
  } else {
    const res = await response.json();
    if (res.failed === true) {
      toast.warning(`Last command failed: ${command} -> ${JSON.stringify(res.result)}`);
    } else if (showSuccess === true) {
      toast.success(`Done: ${command}`);
    }
    return res;
  }
  return response.json();
}

export { postData, showResponse };
