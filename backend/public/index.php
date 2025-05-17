<?php
echo json_encode(["status" => "online", "secure" => isset($_SERVER['HTTPS'])]);
?>
