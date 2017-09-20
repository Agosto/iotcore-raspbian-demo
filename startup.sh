
# check for network before starting
while true ; do
  ping -c 1 -W 5 google.com && break
  echo "Waiting for network.."
  sleep 5
done

echo "Starting iotcore demo.."

cd /home/pi/iotcore-raspbian-demo
node main.js
