import { Component, OnInit } from "@angular/core";
import { Web3Service } from "../util/web3.service";
import { Router, ActivatedRoute } from '@angular/router';

declare let require: any;
const contractABI = require("../../../build/contracts/Revolution.json");

interface ICitizen {
   address: string;
   opened: boolean;
   matchesCriteria: boolean;
   sansculotteScale: number;
   privilegedScale: number
}

@Component({
  selector: "app-revolution",
  templateUrl: "./revolution.component.html",
  styleUrls: ["./revolution.component.css"]
})
export class RevolutionComponent implements OnInit {
  title: String = "<loading title>";
  criteria: String = "<loading criteria>";
  bastilleBalance: String = "?";
  bastilleBalanceInFiat: String = "?";
  revolutionAddress: String = "0x0000000...";
  culottes: any;
  account: any;
  web3Status: String = "Status of connection to your blockchain accounts";
  citizens: Array<ICitizen> = [];
  fullAddressShown: boolean = false;

  constructor(
    private web3Service: Web3Service,
    private route: ActivatedRoute,
    private router: Router) {}

  async ngOnInit() {
    console.log("OnInit: " + this.web3Service);
    console.log(this);
    this.watchAccount();
    let web3_eth_contract = await this
      .web3Service
      .artifactsToContract(
        contractABI
      );
    this.criteria = await web3_eth_contract
      .methods
      .criteria()
      .call();
    this.revolutionAddress = this
      .web3Service
      .revolutionAddress;
    this.bastilleBalance = await web3_eth_contract
      .methods
      .bastilleBalance()
      .call()
      .then( (result) => {
        if (result === null) {
          this
            .web3Service
            .web3Status
            .next("The balance of this bastille is null !");
        } else {
          this
            .web3Service
            .web3Status
            .next("bastille ready.");
          return this
            .web3Service
            .weiToEther(result);
        }
      })
      .catch( (error) => {
        this
          .web3Service
          .web3Status
          .next("An error occured while reading bastille balance: " + error);
      });
    this.showPrice();
    let i = 0;
    let address = "";
    let citizen: ICitizen;
    while (address != null) {
      address = await web3_eth_contract
        .methods
        .citizens(i)
        .call()
        .then( (result) => {
          return result;
        })
        .catch( (error) => {
          this
            .web3Service
            .web3Status
            .next("An error occured while reading citizen " + i.toString() + " : " + error);
          return ""
      });
      if (address != "" && address != null) {
        citizen = await web3_eth_contract
          .methods
          .trialStatus(address)
          .call()
          .then( (result) => {
            return {
              address: address,
              opened: result[0],
              matchesCriteria: result[1],
              sansculotteScale: result[2],
              privilegedScale: result[3]
            };
          })
          .catch( (error) => {
            this
              .web3Service
              .web3Status
              .next("An error occured while reading trialStatus of citizen #" + i.toString() + " : " + error);
          });
        if (citizen != undefined) {
          this.citizens.push(citizen);
        }
      }
      i += 1;
    }
    // this.web3Service.web3Status.next("Here are the citizens known at this bastille : " + this.citizens.toString());
    
  }

  async watchAccount() {
    this
      .web3Service
      .web3Status
      .subscribe(status => {
        this.web3Status = status;
      });
    this
      .web3Service
      .accountsObservable
      .subscribe(accounts => {
        this.account = accounts[0];
      });
  }
  
  showPrice() {
    this.web3Service.getPrice()
    .subscribe((price) => {
      if (price != undefined && this.bastilleBalance != "?") {
        let bbif: number = +this.bastilleBalance * +price.body[this.currency.toString()];
        this.bastilleBalanceInFiat = bbif.toFixed(2).toString();
        /* this
          .web3Service
          .web3Status
          .next(price.body[this.currency.toString()].toString()); */
      }
    });
  }
  
  public onChange(event): void {  // event will give you full breif of action
    this.web3Service.currency = event.target.value;
    this.showPrice();
    /*this
      .web3Service
      .web3Status
      .next(event.target.value.toString()); */
  }
}
