#!/bin/bash
# Script de configuración para Postfix en Debian

echo "Instalando Postfix..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get install -y postfix mailutils

echo "Configurando Postfix..."
# Configurar como Internet Site pero solo loopback
sudo postconf -e "myhostname = sigemech.local"
sudo postconf -e "mydestination = sigemech.local, localhost.localdomain, localhost"
sudo postconf -e "inet_interfaces = loopback-only"
sudo postconf -e "myorigin = /etc/mailname"

echo "sigemech.local" | sudo tee /etc/mailname

# Reiniciar Postfix
sudo system64 restart postfix

echo "Postfix configurado como servidor interno (loopback-only) en sigemech.local"
