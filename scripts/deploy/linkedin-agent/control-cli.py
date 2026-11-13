#!/usr/bin/python3
"""Local owner control. Unix permissions authorize Hermes; no secrets leave the worker."""
import argparse,http.client,json,socket,sys
class UnixConnection(http.client.HTTPConnection):
    def connect(self):
        self.sock=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect('/run/bm-linkedin-control/control.sock')
def main():
    parser=argparse.ArgumentParser(description='Piloter les posts LinkedIn B&M et Ines depuis Hermes Telegram.')
    parser.add_argument('action',choices=['status','queue','post','preview','prospects','prospecting-status','prospecting-pause','prospecting-resume','prospecting-run','pause','resume','configure','plan','profile','run','approve','reject','update','enqueue','feedback'])
    parser.add_argument('account',choices=['ines','bm','person','organization','both'])
    parser.add_argument('--id',dest='item_id')
    parser.add_argument('--json-stdin',action='store_true',help='Lire le payload ou les paramètres configure en JSON depuis stdin.')
    args=parser.parse_args()
    if args.account=='both' and args.action not in ['status','queue','pause','resume']:
        parser.error('both autorisé uniquement pour status, queue, pause et resume.')
    payload=json.load(sys.stdin) if args.json_stdin else None
    selected=['person','organization'] if args.account=='both' else [{'ines':'person','bm':'organization'}.get(args.account,args.account)]
    failed=False
    for account in selected:
        body={'action':args.action,'accountId':account}
        if args.item_id:body['itemId']=args.item_id
        if payload is not None:body['payload']=payload
        try:
            client=UnixConnection('localhost',timeout=100)
            client.request('POST','/control',json.dumps(body),{'Content-Type':'application/json'})
            response=client.getresponse();data=json.load(response);client.close()
            print(json.dumps({'accountId':account,**data},ensure_ascii=False))
            failed=failed or response.status!=200
        except (OSError,ValueError,http.client.HTTPException) as error:
            print(json.dumps({'accountId':account,'ok':False,'error':str(error)},ensure_ascii=False));failed=True
    return int(failed)
if __name__=='__main__':sys.exit(main())
