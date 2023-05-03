#!/bin/bash
cd /root/crm/microelCRMFront/
git pull
mkdir -p /var/www/10.128.227.39
yes | cp -R /root/crm/microelCRMFront/dist/front/* /var/www/10.128.227.39
yes | cp /root/crm/microelCRMFront/10.128.227.39 /etc/nginx/sites-available/
ln -sf /root/crm/microelCRMFront/10.128.227.39 /etc/nginx/sites-enabled/
systemctl restart nginx
