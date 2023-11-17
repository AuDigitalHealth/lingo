package com.csiro.snomio.models;

public class FsnAndPt {

  public String FSN;
  public String PT;

  public FsnAndPt() {}

  public FsnAndPt(String FSN, String PT) {
    this.FSN = FSN;
    this.PT = PT;
  }

  public String getFSN() {
    return FSN;
  }

  public void setFSN(String FSN) {
    this.FSN = FSN;
  }

  public String getPT() {
    return PT;
  }

  public void setPT(String PT) {
    this.PT = PT;
  }
}
